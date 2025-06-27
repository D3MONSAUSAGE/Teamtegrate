
import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import InvoiceFormFields from './invoice-upload/InvoiceFormFields';
import InvoiceUploadButtons from './invoice-upload/InvoiceUploadButtons';
import InvoiceUploadDropzone from './invoice-upload/InvoiceUploadDropzone';
import InvoiceUploadStatus from './invoice-upload/InvoiceUploadStatus';
import InvoiceAccessRestriction from './invoice-upload/InvoiceAccessRestriction';
import { uploadInvoiceFileSimple } from './invoice-upload/SimpleInvoiceUpload';

interface InvoiceMetadata {
  invoiceNumber: string;
  invoiceDate: string;
  branch: string;
}

interface InvoiceUploadProps {
  onUploadSuccess?: () => void;
}

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ onUploadSuccess }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
  const [branch, setBranch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check if user has permission to upload invoices
  const canUploadInvoices = user && ['manager', 'admin', 'superadmin'].includes(user.role);

  const uploadInvoice = useCallback(async (file: File, metadata: InvoiceMetadata) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Uploading file...');
      console.log('Starting invoice upload process for file:', file.name);

      // Use simplified upload
      const uploadResult = await uploadInvoiceFileSimple(file, user.organizationId, user.id);
      
      setUploadProgress(50);
      setUploadStatus('File uploaded, saving to database...');
      
      if (!uploadResult.success) {
        console.error('Upload failed:', uploadResult.error);
        toast.error(uploadResult.error || 'Upload failed');
        setUploadStatus('Upload failed');
        return;
      }

      console.log('File uploaded successfully, inserting into database...');

      // Insert into database
      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: metadata.invoiceNumber,
          invoice_date: metadata.invoiceDate,
          branch: metadata.branch,
          uploader_name: user.name || user.email,
          file_name: file.name,
          file_type: file.type,
          file_path: uploadResult.filePath!,
          file_size: file.size,
          user_id: user.id,
          organization_id: user.organizationId
        });

      if (dbError) {
        console.error('Database error:', dbError);
        
        // Clean up uploaded file on database error
        try {
          await supabase.storage
            .from('documents')
            .remove([uploadResult.filePath!]);
          console.log('Cleaned up file after database error');
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError);
        }
        
        toast.error(`Database error: ${dbError.message}`);
        setUploadStatus('Database save failed');
        return;
      }

      setUploadProgress(100);
      setUploadStatus('Upload complete!');

      console.log('Invoice uploaded and saved successfully');
      
      toast.success(
        `Invoice "${metadata.invoiceNumber}" uploaded successfully!`,
        {
          description: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          duration: 4000,
        }
      );
      
      // Reset form
      setInvoiceNumber('');
      setInvoiceDate(undefined);
      setBranch('');
      
      // Reset upload status after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
      
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed - please try again', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 6000,
      });
      setUploadStatus('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [user?.organizationId, user?.name, user?.email, user?.id, onUploadSuccess]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!invoiceNumber || !invoiceDate || !branch) {
      toast.error('Please fill in all invoice details before uploading');
      return;
    }

    const metadata: InvoiceMetadata = {
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate.toISOString(),
      branch: branch,
    };

    await uploadInvoice(file, metadata);
  }, [invoiceNumber, invoiceDate, branch, uploadInvoice]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await handleFileUpload(file);
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isUploading || !canUploadInvoices
  });

  const handleCameraCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!canUploadInvoices) {
    return <InvoiceAccessRestriction />;
  }

  const hasRequiredFields = !!(invoiceNumber && invoiceDate && branch);
  const isUploadDisabled = isUploading || !hasRequiredFields;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={isMobile ? "text-xl" : "text-2xl"}>Upload Invoice</CardTitle>
        <CardDescription className={isMobile ? "text-sm" : "text-base"}>
          Upload a new invoice document (PDF or Image)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Details Form */}
        <InvoiceFormFields
          invoiceNumber={invoiceNumber}
          setInvoiceNumber={setInvoiceNumber}
          invoiceDate={invoiceDate}
          setInvoiceDate={setInvoiceDate}
          branch={branch}
          setBranch={setBranch}
          isUploading={isUploading}
        />

        {/* Upload Section */}
        <div className="space-y-4">
          {/* Camera & File Selection Buttons */}
          <InvoiceUploadButtons
            onCameraClick={openCamera}
            onFileClick={openFileSelect}
            isDisabled={isUploadDisabled}
          />

          {/* Drag & Drop Area */}
          <InvoiceUploadDropzone
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            isDisabled={isUploadDisabled}
          />

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
            accept="application/pdf,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Status */}
        <InvoiceUploadStatus
          isUploading={isUploading}
          hasRequiredFields={hasRequiredFields}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
        />
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
