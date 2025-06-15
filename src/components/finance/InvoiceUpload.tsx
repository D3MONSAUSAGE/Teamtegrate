
import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Camera, Upload, FileImage, Shield } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

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
  const isTablet = useIsTablet();
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

      const timestamp = new Date().getTime();
      const filePath = `invoices/${user.organizationId}/${user.id}/${timestamp}-${file.name}`;
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('Storage error:', storageError);
        throw storageError;
      }

      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: metadata.invoiceNumber,
          invoice_date: metadata.invoiceDate,
          branch: metadata.branch,
          uploader_name: user.name || user.email,
          file_name: file.name,
          file_type: file.type,
          file_path: filePath,
          file_size: file.size,
          user_id: user.id,
          organization_id: user.organizationId
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      toast.success('Invoice uploaded successfully');
      
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
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            Access Restricted
          </CardTitle>
          <CardDescription>
            Invoice upload is restricted to managers, admins, and superadmins only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              You need manager-level permissions or higher to upload invoices.
              Please contact your administrator if you need access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice</CardTitle>
        <CardDescription>Upload a new invoice document (PDF or Image)</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Invoice Details Form */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter invoice number"
              className={isMobile ? "h-12 text-base" : ""}
              disabled={isUploading}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="invoiceDate">Invoice Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    isMobile ? "h-12 text-base" : "h-10",
                    !invoiceDate && "text-muted-foreground"
                  )}
                  disabled={isUploading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={setInvoiceDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="branch">Branch/Location *</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Enter branch or location"
              className={isMobile ? "h-12 text-base" : ""}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          {/* Mobile Camera & File Buttons */}
          {(isMobile || isTablet) && (
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                onClick={openCamera}
                disabled={isUploading || !invoiceNumber || !invoiceDate || !branch}
                className="h-14 text-base bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo with Camera
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={openFileSelect}
                disabled={isUploading || !invoiceNumber || !invoiceDate || !branch}
                className="h-14 text-base"
              >
                <FileImage className="mr-2 h-5 w-5" />
                Choose from Gallery
              </Button>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "opacity-50 pointer-events-none",
              (!invoiceNumber || !invoiceDate || !branch) && "opacity-50 pointer-events-none",
              isMobile ? "p-8" : "p-6"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <Upload className={`text-muted-foreground ${isMobile ? "h-8 w-8" : "h-6 w-6"}`} />
              <div className="space-y-1">
                <p className={`font-medium ${isMobile ? "text-base" : "text-sm"}`}>
                  {isDragActive ? "Drop the file here..." : "Drag & drop files here"}
                </p>
                <p className={`text-muted-foreground ${isMobile ? "text-sm" : "text-xs"}`}>
                  Supports PDF, PNG, JPG, JPEG
                </p>
                {!(isMobile || isTablet) && (
                  <p className="text-xs text-muted-foreground">
                    or click to browse files
                  </p>
                )}
              </div>
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
            accept="application/pdf,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Uploading invoice...</span>
          </div>
        )}

        {/* Requirements Notice */}
        {(!invoiceNumber || !invoiceDate || !branch) && (
          <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            Please fill in all invoice details above before uploading files.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
