import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const BRANCH_OPTIONS = [
  'Sylmar',
  'Canyon', 
  'Via Princessa',
  'Palmdale',
  'Panorama',
  'Cocina',
  'Corp'
];

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "Invoice number is required" }),
  branch: z.string().min(1, { message: "Branch is required" }),
  uploaderName: z.string().min(1, { message: "Uploader name is required" }),
  invoiceDate: z.string().min(1, { message: "Invoice date is required" }),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceUploadProps {
  onUploadSuccess: () => void;
}

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema)
  });

  const watchBranch = watch('branch');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "Success",
        description: `File "${file.name}" selected`,
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "Success",
        description: `Photo "${file.name}" captured`,
      });
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: 'Please select a file to upload',
        variant: "destructive",
      });
      return;
    }

    if (!user || !user.organizationId) {
      toast({
        title: "Error",
        description: 'You must be logged in and belong to an organization to upload invoices',
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Starting invoice upload process...');
      console.log('User:', user.id, 'Organization:', user.organizationId);
      console.log('File:', selectedFile.name, selectedFile.size);

      // Create file path with user ID and timestamp
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${data.invoiceNumber}.${fileExtension}`;
      const filePath = `${user.id}/invoices/${fileName}`;

      console.log('Uploading to path:', filePath);

      // First, let's check if the documents bucket exists and create invoices folder
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        console.error('Storage error:', storageError);
        throw new Error(`Storage error: ${storageError.message}`);
      }

      console.log('File uploaded successfully:', storageData);

      // Insert invoice metadata into database with organizationId
      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          organization_id: user.organizationId, // Use organizationId instead of organization_id
          invoice_number: data.invoiceNumber,
          branch: data.branch,
          uploader_name: data.uploaderName,
          invoice_date: data.invoiceDate,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_path: storageData.path,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Invoice metadata saved successfully');

      toast({
        title: "Success",
        description: 'Invoice uploaded successfully!',
      });
      
      reset();
      setSelectedFile(null);
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload invoice. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice</CardTitle>
        <CardDescription>
          Upload invoices with metadata for easy tracking and retrieval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <Label>Invoice File (PDF, PNG, JPEG)</Label>
            <div
              {...getRootProps()}
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                ${selectedFile ? 'bg-green-50 border-green-300' : ''}
                ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                  <p className="text-xs text-green-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag & drop an invoice file here, or click to select"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, PNG, JPEG (Max 10MB)
                  </p>
                </>
              )}
            </div>

            {/* Camera Button */}
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraCapture}
                disabled={isUploading}
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Take Photo</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                {...register('invoiceNumber')}
                placeholder="Enter invoice number"
                className="mt-1"
              />
              {errors.invoiceNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="branch">Branch *</Label>
              <Select onValueChange={(value) => setValue('branch', value)} value={watchBranch}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_OPTIONS.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch && (
                <p className="text-sm text-red-600 mt-1">{errors.branch.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="uploaderName">Uploader Name *</Label>
              <Input
                id="uploaderName"
                {...register('uploaderName')}
                placeholder="Enter your name"
                className="mt-1"
              />
              {errors.uploaderName && (
                <p className="text-sm text-red-600 mt-1">{errors.uploaderName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                {...register('invoiceDate')}
                className="mt-1"
              />
              {errors.invoiceDate && (
                <p className="text-sm text-red-600 mt-1">{errors.invoiceDate.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Invoice'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
