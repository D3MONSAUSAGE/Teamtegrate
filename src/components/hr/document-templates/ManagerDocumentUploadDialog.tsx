import React, { useState } from 'react';
import { Camera, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

interface ManagerDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compliance: DocumentComplianceTracking | null;
  employeeName: string;
  onUploadSuccess: () => void;
}

export const ManagerDocumentUploadDialog: React.FC<ManagerDocumentUploadDialogProps> = ({
  open,
  onOpenChange,
  compliance,
  employeeName,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [verifyNow, setVerifyNow] = useState(false);

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

    if (!compliance || !user) {
      toast.error('Missing required information');
      return;
    }

    if (compliance.requires_expiry && !expiryDate) {
      toast.error('Please set an expiry date for this document');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.organizationId}/${compliance.employee_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-records')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Insert or update record in database
      const recordData = {
        organization_id: user.organizationId,
        employee_id: compliance.employee_id,
        uploader_id: user.id,
        uploader_name: user.name || user.email || 'Unknown',
        requirement_id: compliance.requirement_id,
        document_name: compliance.document_name,
        document_type: compliance.document_type,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        file_path: filePath,
        expiry_date: expiryDate || null,
        notes: notes.trim() || null,
        is_verified: verifyNow,
        verified_by: verifyNow ? user.id : null,
        verified_at: verifyNow ? new Date().toISOString() : null,
      };

      // Check if there's an existing record to update
      if (compliance.record_id) {
        const { error: updateError } = await supabase
          .from('employee_records')
          .update(recordData)
          .eq('id', compliance.record_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('employee_records')
          .insert(recordData);

        if (insertError) throw insertError;
      }

      toast.success(
        verifyNow 
          ? 'Document uploaded and verified successfully' 
          : 'Document uploaded successfully. Pending verification.'
      );

      // Reset form
      setSelectedFile(null);
      setExpiryDate('');
      setNotes('');
      setVerifyNow(false);

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
      setVerifyNow(false);
      onOpenChange(false);
    }
  };

  if (!compliance) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {compliance.record_id ? 'Replace Document' : 'Upload Document'}
          </DialogTitle>
          <DialogDescription>
            Upload {compliance.document_name} for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Information - Read Only */}
          <div className="space-y-3 p-3 bg-muted rounded-md">
            <div>
              <Label className="text-xs text-muted-foreground">Employee</Label>
              <p className="text-sm font-medium">{employeeName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Document Name</Label>
              <p className="text-sm font-medium">{compliance.document_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Document Type</Label>
              <p className="text-sm font-medium capitalize">
                {compliance.document_type.replace(/_/g, ' ')}
              </p>
            </div>
            {compliance.is_required && (
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
                onClick={() => document.getElementById('manager-file-input')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <Button type="button" variant="outline" onClick={handleCameraCapture}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              id="manager-file-input"
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
          {compliance.requires_expiry && (
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required={compliance.requires_expiry}
              />
              {compliance.default_validity_days && (
                <p className="text-xs text-muted-foreground">
                  Suggested: {compliance.default_validity_days} days from today
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

          {/* Verify Document Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verifyNow"
              checked={verifyNow}
              onCheckedChange={(checked) => setVerifyNow(checked as boolean)}
            />
            <label
              htmlFor="verifyNow"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Verify document immediately
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? 'Uploading...' : compliance.record_id ? 'Replace' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
