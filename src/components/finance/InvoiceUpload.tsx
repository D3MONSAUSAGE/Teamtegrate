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
import { uploadInvoiceFile } from './invoice-upload/InvoiceUploadHelpers';

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
      console.log('Starting invoice upload process for file:', file.name);

      // Use the new upload helper
      const uploadResult = await uploadInvoiceFile(file, user.organizationId, user.id);
      
      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Upload failed');
        return;
      }

      console.log('File uploaded successfully, inserting into database...');

      // Only insert into database if file upload was successful
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
        
        // If database insert fails, try to clean up the uploaded file
        try {
          await supabase.storage
            .from('documents')
            .remove([uploadResult.filePath!]);
        } catch (cleanupError) {
          console.error('Failed to cleanup file after database error:', cleanupError);
        }
        
        toast.error(`Database error: ${dbError.message}`);
        return;
      }

      console.log('Invoice uploaded and saved successfully');
      
      // Enhanced success feedback
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
      
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed - please try again');
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
    // Reset the input so the same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset the input so the same file can be selected again
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
        />
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
