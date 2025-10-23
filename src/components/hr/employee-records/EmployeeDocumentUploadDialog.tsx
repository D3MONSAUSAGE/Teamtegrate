import React, { useState } from 'react';
import { Camera, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DocumentComplianceTracking } from '@/types/document-templates';

interface EmployeeDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentItem: DocumentComplianceTracking | null;
  onUploadSuccess: () => void;
}

export const EmployeeDocumentUploadDialog: React.FC<EmployeeDocumentUploadDialogProps> = ({
  open,
  onOpenChange,
  documentItem,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF or image files only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!documentItem || !user) {
      toast.error('Missing required information');
      return;
    }

    if (documentItem.requires_expiry && !expiryDate) {
      toast.error('Please set an expiry date for this document');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.organizationId}/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-records')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Insert record into database
      const { error: insertError } = await supabase
        .from('employee_records')
        .insert({
          organization_id: user.organizationId,
          employee_id: user.id,
          uploader_id: user.id,
          uploader_name: user.name || user.email || 'Unknown',
          requirement_id: documentItem.requirement_id,
          document_name: documentItem.document_name,
          document_type: documentItem.document_type,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_path: filePath,
          expiry_date: expiryDate || null,
          notes: notes.trim() || null,
          is_verified: false,
        });

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully. Pending verification.');

      // Reset form
      setSelectedFile(null);
      setExpiryDate('');
      setNotes('');

      onUploadSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setExpiryDate('');
      setNotes('');
      onOpenChange(false);
    }
  };

  if (!documentItem) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload your {documentItem.document_name} for verification
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Information - Read Only */}
          <div className="space-y-3 p-3 bg-muted rounded-md">
            <div>
              <Label className="text-xs text-muted-foreground">Document Name</Label>
              <p className="text-sm font-medium">{documentItem.document_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Document Type</Label>
              <p className="text-sm font-medium capitalize">
                {documentItem.document_type.replace(/_/g, ' ')}
              </p>
            </div>
            {documentItem.is_required && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <span>*</span>
                <span>Required Document</span>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById('employee-file-input')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <Button type="button" variant="outline" onClick={handleCameraCapture}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              id="employee-file-input"
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Expiry Date - Conditional */}
          {documentItem.requires_expiry && (
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required={documentItem.requires_expiry}
              />
              {documentItem.default_validity_days && (
                <p className="text-xs text-muted-foreground">
                  Suggested: {documentItem.default_validity_days} days from today
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
