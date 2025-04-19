
import React from 'react';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  created_at: string;
  size_bytes: number;
}

interface DocumentListProps {
  documents: DocumentItem[];
  onDocumentDeleted: () => void;
  isLoading?: boolean; // Add the isLoading prop
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDocumentDeleted, isLoading = false }) => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentItem | null>(null);
  const isMobile = useIsMobile();

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handlePreview = async (documentItem: DocumentItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(documentItem.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      setPreviewUrl(url);
      setSelectedDocument(documentItem);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDownload = async (documentItem: DocumentItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(documentItem.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentItem.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (documentItem: DocumentItem) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([documentItem.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentItem.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
      
      onDocumentDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className={isMobile ? "hidden" : ""}>Type</TableHead>
            <TableHead className={isMobile ? "hidden" : ""}>Size</TableHead>
            <TableHead className={isMobile ? "hidden" : ""}>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 2 : 5} className="text-center py-8 text-muted-foreground">
                Loading documents...
              </TableCell>
            </TableRow>
          ) : documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 2 : 5} className="text-center text-muted-foreground">
                No documents uploaded yet
              </TableCell>
            </TableRow>
          ) : (
            documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="line-clamp-1">{document.title}</span>
                </TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>{document.file_type.split('/')[1].toUpperCase()}</TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>{formatFileSize(document.size_bytes)}</TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>{new Date(document.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  {document.file_type === 'application/pdf' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePreview(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className={`
          w-full max-h-screen p-0 overflow-hidden
          ${isMobile ? 'max-w-full h-full' : 'max-w-[90vw] w-[900px] max-h-[90vh]'}
        `}>
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-sm sm:text-base line-clamp-1">
              {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className={`w-full ${isMobile ? 'h-[calc(100vh-60px)]' : 'h-[80vh]'}`}>
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Document Preview"
                aria-label={`Preview of ${selectedDocument?.title}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentList;
