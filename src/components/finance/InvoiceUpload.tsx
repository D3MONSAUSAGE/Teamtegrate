
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
  teamId: string;
  vendorId?: string;
  expenseCategoryId?: string;
  invoiceTotal?: number;
  currency: string;
  paymentDueDate?: string;
  paymentStatus: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  tags?: string[];
}

interface InvoiceUploadProps {
  onUploadSuccess?: () => void;
}

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ onUploadSuccess }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
  const [teamId, setTeamId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentDueDate, setPaymentDueDate] = useState<Date | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('none');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
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

      // Use simplified upload
      const uploadResult = await uploadInvoiceFileSimple(file, user.organizationId, user.id);
      
      setUploadProgress(50);
      setUploadStatus('File uploaded, saving to database...');
      
      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Upload failed');
        setUploadStatus('Upload failed');
        return;
      }

      // Insert into database
      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: metadata.invoiceNumber,
          invoice_date: metadata.invoiceDate,
          branch: '', // Temporary fallback for backward compatibility
          team_id: metadata.teamId,
          uploader_name: user.name || user.email,
          file_name: file.name,
          file_type: file.type,
          file_path: uploadResult.filePath!,
          file_size: file.size,
          user_id: user.id,
          organization_id: user.organizationId,
          // New financial tracking fields
          vendor_id: metadata.vendorId || null,
          invoice_total: metadata.invoiceTotal || null,
          currency: metadata.currency,
          payment_status: metadata.paymentStatus,
          payment_due_date: metadata.paymentDueDate || null,
          paid_amount: 0,
          expense_category_id: metadata.expenseCategoryId || null,
          payment_method: metadata.paymentMethod || null,
          reference_number: metadata.referenceNumber || null,
          notes: metadata.notes || null,
          tags: metadata.tags || null
        });

      if (dbError) {
        // Clean up uploaded file on database error
        try {
          await supabase.storage
            .from('documents')
            .remove([uploadResult.filePath!]);
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError);
        }
        
        toast.error(`Database error: ${dbError.message}`);
        setUploadStatus('Database save failed');
        return;
      }

      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      
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
      setTeamId('');
      setVendorId('');
      setExpenseCategoryId('');
      setInvoiceTotal('');
      setCurrency('USD');
      setPaymentDueDate(undefined);
      setPaymentStatus('unpaid');
      setPaymentMethod('none');
      setReferenceNumber('');
      setNotes('');
      setTags('');
      
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
    // Validate required fields
    if (!invoiceNumber || !invoiceDate || !teamId || !vendorId || !expenseCategoryId || !invoiceTotal) {
      toast.error('Please fill in all required fields (Invoice Number, Date, Team, Vendor, Category, Total)');
      return;
    }

    // Validate invoice total
    const totalAmount = parseFloat(invoiceTotal);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Invoice total must be greater than 0');
      return;
    }

    // Validate payment due date
    if (paymentDueDate && paymentDueDate < invoiceDate) {
      toast.error('Payment due date must be on or after invoice date');
      return;
    }

    // Parse tags
    const parsedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const metadata: InvoiceMetadata = {
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate.toISOString(),
      teamId: teamId,
      vendorId: vendorId,
      expenseCategoryId: expenseCategoryId,
      invoiceTotal: totalAmount,
      currency: currency,
      paymentDueDate: paymentDueDate?.toISOString(),
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod === 'none' ? undefined : paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined
    };

    await uploadInvoice(file, metadata);
  }, [invoiceNumber, invoiceDate, teamId, vendorId, expenseCategoryId, invoiceTotal, 
      currency, paymentDueDate, paymentStatus, paymentMethod, referenceNumber, notes, tags, uploadInvoice]);

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

  const hasRequiredFields = !!(
    invoiceNumber && 
    invoiceDate && 
    teamId && 
    vendorId && 
    expenseCategoryId && 
    invoiceTotal && 
    parseFloat(invoiceTotal) > 0
  );
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
          teamId={teamId}
          setTeamId={setTeamId}
          vendorId={vendorId}
          setVendorId={setVendorId}
          expenseCategoryId={expenseCategoryId}
          setExpenseCategoryId={setExpenseCategoryId}
          invoiceTotal={invoiceTotal}
          setInvoiceTotal={setInvoiceTotal}
          currency={currency}
          setCurrency={setCurrency}
          paymentDueDate={paymentDueDate}
          setPaymentDueDate={setPaymentDueDate}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          referenceNumber={referenceNumber}
          setReferenceNumber={setReferenceNumber}
          notes={notes}
          setNotes={setNotes}
          tags={tags}
          setTags={setTags}
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
