
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentUploaderProps {
  onUploadSuccess: () => void;
  folder?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess, folder }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    
    // Auto-populate title if only one file and no title set
    if (acceptedFiles.length === 1 && !title) {
      setTitle(acceptedFiles[0].name.split('.')[0]);
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !title.trim()) {
      toast({
        title: "Error",
        description: 'Please select files and provide a title',
        variant: "destructive",
      });
      return;
    }

    if (!user || !user.organizationId) {
      toast({
        title: "Error",
        description: 'You must be logged in and belong to an organization to upload documents',
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        // Create file path
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          throw new Error(`Storage error: ${storageError.message}`);
        }

        // Insert document metadata
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            organization_id: user.organizationId,
            title: selectedFiles.length === 1 ? title : `${title} - ${file.name}`,
            description: description || null,
            file_path: storageData.path,
            file_type: file.type,
            size_bytes: file.size,
            storage_id: storageData.path,
            folder: folder || null,
          });

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} document(s) uploaded successfully!`,
      });
      
      // Reset form
      setSelectedFiles([]);
      setTitle('');
      setDescription('');
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload documents',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload documents to your organization's document library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div>
          <Label>Select Files</Label>
          <div
            {...getRootProps()}
            className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
              ${selectedFiles.length > 0 ? 'bg-green-50 border-green-300' : ''}
              ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the files here"
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports all file types (Max 50MB per file)
            </p>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({selectedFiles.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Title Field */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
            disabled={isUploading}
          />
        </div>

        {/* Description Field */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter document description (optional)"
            rows={3}
            disabled={isUploading}
          />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFiles.length || !title.trim() || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Documents'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
