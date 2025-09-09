import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, AlertTriangle } from 'lucide-react';
import { useUpdateCertificate } from '@/hooks/useTrainingData';

interface CertificateReplacementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: {
    id: string;
    content_title: string;
    certificate_url?: string;
    certificate_status: string;
  };
}

const CertificateReplacementModal: React.FC<CertificateReplacementModalProps> = ({
  open,
  onOpenChange,
  assignment
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const updateCertificate = useUpdateCertificate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      await updateCertificate.mutateAsync({
        assignmentId: assignment.id,
        certificateFile: selectedFile,
        reason: reason.trim() || 'Certificate replacement'
      });
      
      // Reset form and close modal
      setSelectedFile(null);
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error replacing certificate:', error);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setReason('');
    onOpenChange(false);
  };

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  const isPdfFile = (file: File) => {
    return file.type === 'application/pdf';
  };

  const getFileIcon = (file: File) => {
    if (isImageFile(file)) {
      return <Image className="h-6 w-6 text-blue-600" />;
    } else {
      return <FileText className="h-6 w-6 text-red-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <Upload className="h-5 w-5 text-orange-600" />
            </div>
            Replace Certificate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium mb-2">{assignment.content_title}</h3>
                  <Badge className="text-xs">
                    Current Status: {assignment.certificate_status}
                  </Badge>
                </div>
                {assignment.certificate_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(assignment.certificate_url, '_blank')}
                  >
                    View Current
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Important Notice</p>
              <p className="text-sm text-yellow-700 mt-1">
                Replacing this certificate will reset its verification status to "uploaded" and require re-approval from your manager.
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="certificate-file">New Certificate File</Label>
            
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('certificate-file')?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drop your certificate file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, JPG, PNG files up to 10MB
                </p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(selectedFile)}
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Input
              id="certificate-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Replacement (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Uploaded wrong file, better quality image, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={updateCertificate.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || updateCertificate.isPending}
            >
              {updateCertificate.isPending ? 'Uploading...' : 'Replace Certificate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateReplacementModal;