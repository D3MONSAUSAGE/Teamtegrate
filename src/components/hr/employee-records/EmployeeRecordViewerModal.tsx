import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface EmployeeRecordViewerModalProps {
  record: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmployeeRecordViewerModal: React.FC<EmployeeRecordViewerModalProps> = ({
  record,
  open,
  onOpenChange,
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (record && open) {
      loadFile();
    } else {
      setFileUrl(null);
    }
  }, [record, open]);

  const loadFile = async () => {
    if (!record) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('employee-records')
        .createSignedUrl(record.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      setFileUrl(data.signedUrl);
    } catch (error: any) {
      console.error('Error loading file:', error);
      toast.error('Failed to load file preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!record) return;

    try {
      const { data, error } = await supabase.storage
        .from('employee-records')
        .download(record.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  if (!record) return null;

  const isPdf = record.file_type === 'application/pdf';
  const isImage = record.file_type.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{record.document_name}</DialogTitle>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p>File: {record.file_name}</p>
                {record.document_date && (
                  <p>Document Date: {format(parseISO(record.document_date), 'PP')}</p>
                )}
                {record.expiry_date && (
                  <p>Expiry Date: {format(parseISO(record.expiry_date), 'PP')}</p>
                )}
                {record.notes && <p>Notes: {record.notes}</p>}
                {record.tags && record.tags.length > 0 && (
                  <p>Tags: {record.tags.join(', ')}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-muted/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading preview...</p>
            </div>
          ) : !fileUrl ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unable to load preview</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={fileUrl}
                alt={record.document_name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Preview not available for this file type. Please download to view.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeRecordViewerModal;
