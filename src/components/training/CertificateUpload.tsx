import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  FileImage, 
  Monitor, 
  Upload, 
  X, 
  Eye, 
  Download,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface CertificateUploadProps {
  assignmentId: string;
  assignmentTitle: string;
  currentCertificateUrl?: string;
  onUploadComplete: (certificateUrl: string) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

const CertificateUpload: React.FC<CertificateUploadProps> = ({
  assignmentId,
  assignmentTitle,
  currentCertificateUrl,
  onUploadComplete,
  onUploadStart,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Generate file preview
  const generatePreview = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid file type (JPEG, PNG, WebP, PDF, or GIF)');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    generatePreview(file);
  }, [generatePreview]);

  // Handle camera capture
  const handleCameraCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // Handle file input
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // Handle screen capture
  const handleScreenCapture = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error('Screen capture is not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          toast.error('Could not create canvas context');
          return;
        }

        ctx.drawImage(video, 0, 0);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `screenshot-${assignmentId}-${Date.now()}.png`, { 
              type: 'image/png' 
            });
            handleFileSelect(file);
          } else {
            toast.error('Failed to create screenshot file');
          }
        }, 'image/png', 0.9);
      });

    } catch (error) {
      console.error('Screen capture error:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Screen capture permission denied');
      } else {
        toast.error('Failed to capture screen. Please try again.');
      }
    }
  }, [assignmentId, handleFileSelect]);

  // Upload certificate with improved error handling and reliability
  const uploadCertificate = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    let uploadedFilePath: string | null = null;

    try {
      setIsUploading(true);
      setUploadProgress(10);
      onUploadStart?.();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required - please log in again');
      }

      setUploadProgress(20);

      // Generate file path: user_id/assignment_id/timestamp_filename
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_certificate.${fileExtension}`;
      const filePath = `${user.id}/${assignmentId}/${fileName}`;
      uploadedFilePath = filePath;

      console.log('🔄 Starting certificate upload:', {
        assignmentId,
        filePath,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        userId: user.id
      });

      setUploadProgress(30);

      // Verify assignment ownership before upload
      const { data: assignment, error: assignmentError } = await supabase
        .from('training_assignments')
        .select('id, assigned_to, status')
        .eq('id', assignmentId)
        .eq('assigned_to', user.id)
        .single();

      if (assignmentError) {
        console.error('❌ Assignment verification failed:', assignmentError);
        throw new Error('Assignment not found or access denied');
      }

      if (!assignment) {
        throw new Error('You are not assigned to this training');
      }

      setUploadProgress(40);

      // Upload file to storage with retry logic
      let uploadAttempt = 0;
      let uploadData, uploadError;
      
      do {
        uploadAttempt++;
        console.log(`🔄 Upload attempt ${uploadAttempt}...`);
        
        const { data, error } = await supabase.storage
          .from('training-certificates')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        uploadData = data;
        uploadError = error;
        
        if (uploadError && uploadAttempt < 3) {
          console.warn(`⚠️ Upload attempt ${uploadAttempt} failed, retrying...`, uploadError.message);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      } while (uploadError && uploadAttempt < 3);

      if (uploadError) {
        console.error('❌ Upload failed after 3 attempts:', uploadError);
        
        // Provide specific error messages based on error type
        if (uploadError.message?.includes('row-level security policy')) {
          throw new Error('Upload permission denied - please ensure you are assigned to this training');
        } else if (uploadError.message?.includes('payload too large')) {
          throw new Error('File too large - maximum size is 50MB');
        } else if (uploadError.message?.includes('duplicate')) {
          throw new Error('A certificate with this name already exists - please try again');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      console.log('✅ File uploaded successfully:', uploadData);
      setUploadProgress(70);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('training-certificates')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate certificate URL');
      }

      console.log('📄 Generated public URL:', publicUrl);
      setUploadProgress(85);

      // Update assignment with certificate URL and status
      const { error: updateError } = await supabase
        .from('training_assignments')
        .update({
          certificate_url: publicUrl,
          certificate_status: 'uploaded',
          certificate_uploaded_at: new Date().toISOString(),
          notes: notes.trim() || null
        })
        .eq('id', assignmentId)
        .eq('assigned_to', user.id);

      if (updateError) {
        console.error('❌ Assignment update error:', updateError);
        throw new Error(`Failed to update assignment: ${updateError.message}`);
      }

      setUploadProgress(100);
      
      console.log('🎉 Certificate upload completed successfully!');
      toast.success('Certificate uploaded and verified successfully!', {
        description: 'Your certificate is now pending review by administrators.'
      });
      
      // Clear form
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes('');
      
      onUploadComplete(publicUrl);

    } catch (error) {
      console.error('❌ Certificate upload error:', error);
      
      // If upload succeeded but database update failed, clean up the uploaded file
      if (uploadedFilePath && error instanceof Error && error.message.includes('Failed to update assignment')) {
        console.log('🧹 Cleaning up uploaded file due to database error...');
        try {
          await supabase.storage
            .from('training-certificates')
            .remove([uploadedFilePath]);
          console.log('✅ Cleanup completed');
        } catch (cleanupError) {
          console.error('⚠️ Failed to cleanup uploaded file:', cleanupError);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload certificate';
      toast.error('Certificate Upload Failed', {
        description: errorMessage
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, assignmentId, notes, onUploadComplete, onUploadStart]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  const openCamera = () => cameraInputRef.current?.click();
  const openFileSelect = () => fileInputRef.current?.click();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Certificate Upload
        </CardTitle>
        <CardDescription>
          Upload your training certificate for "{assignmentTitle}"
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentCertificateUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Certificate Uploaded
                </Badge>
                <span className="text-sm text-green-700">
                  Your certificate has been uploaded
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentCertificateUrl, '_blank')}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        )}

        {/* Upload Options */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Choose Upload Method</Label>
          
          <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-3")}>
            <Button
              type="button"
              variant="outline"
              onClick={openCamera}
              disabled={disabled || isUploading}
              className={cn(
                "flex flex-col items-center gap-2 h-auto py-4",
                isMobile ? "h-16 flex-row justify-center" : ""
              )}
            >
              <Camera className={cn("h-5 w-5", isMobile ? "mr-2" : "")} />
              <span className={cn("text-sm", isMobile ? "" : "text-center")}>
                {isMobile ? "Take Photo" : "Camera\nCapture"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={openFileSelect}
              disabled={disabled || isUploading}
              className={cn(
                "flex flex-col items-center gap-2 h-auto py-4",
                isMobile ? "h-16 flex-row justify-center" : ""
              )}
            >
              <FileImage className={cn("h-5 w-5", isMobile ? "mr-2" : "")} />
              <span className={cn("text-sm", isMobile ? "" : "text-center")}>
                {isMobile ? "Browse Files" : "File\nBrowser"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleScreenCapture}
              disabled={disabled || isUploading}
              className={cn(
                "flex flex-col items-center gap-2 h-auto py-4",
                isMobile ? "h-16 flex-row justify-center" : ""
              )}
            >
              <Monitor className={cn("h-5 w-5", isMobile ? "mr-2" : "")} />
              <span className={cn("text-sm", isMobile ? "" : "text-center")}>
                {isMobile ? "Screen Capture" : "Screen\nCapture"}
              </span>
            </Button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.gif"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* File Preview */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {previewUrl && (
              <div className="relative max-w-xs mx-auto">
                <img
                  src={previewUrl}
                  alt="Certificate preview"
                  className="w-full rounded-lg border shadow-sm"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes about your certificate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isUploading}
            rows={3}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading certificate...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={uploadCertificate}
          disabled={!selectedFile || isUploading || disabled}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Certificate
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Certificate Upload Guidelines:</p>
              <ul className="text-xs space-y-1">
                <li>• Supported formats: JPEG, PNG, WebP, PDF, GIF</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Take a clear photo or screenshot of your completion certificate</li>
                <li>• Ensure all text is readable and the certificate shows completion</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateUpload;