
import React from 'react';
import { FileText, Download, Trash2, Eye, Folder, Pin, PinOff, ExternalLink, Image, File, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';
import { useAuth } from '@/contexts/AuthContext';
import PinToBulletinDialog from './PinToBulletinDialog';
import { DocumentViewer } from './DocumentViewer';
import { getFileTypeCategory } from '@/lib/browser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  created_at: string;
  size_bytes: number;
  folder?: string | null;
  is_pinned?: boolean;
}

interface DocumentListProps {
  documents: DocumentItem[];
  onDocumentDeleted: () => void;
  onDocumentUpdated?: () => void;
  isLoading?: boolean;
  currentFolder?: string;
  onBulletinPostCreated?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentDeleted,
  onDocumentUpdated,
  isLoading = false,
  currentFolder = "",
  onBulletinPostCreated,
}) => {
  const { toast } = useToast();
  const [showPinDialog, setShowPinDialog] = React.useState(false);
  const [documentToPin, setDocumentToPin] = React.useState<DocumentItem | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { hasRoleAccess } = useRoleAccess(user);
  
  const canPinToBulletin = hasRoleAccess('manager');
  const canPinDocuments = hasRoleAccess('manager');

  // Sort documents: pinned first, then by creation date
  const sortedDocuments = React.useMemo(() => {
    return [...documents].sort((a, b) => {
      // First sort by pinned status (pinned first)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [documents]);

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

  const getFileIcon = (fileName: string) => {
    const fileType = getFileTypeCategory(fileName);
    const iconClass = "h-4 w-4";
    
    switch (fileType) {
      case 'image':
        return <Image className={iconClass} />;
      case 'pdf':
        return <FileText className={iconClass} />;
      case 'document':
        return <FileSpreadsheet className={iconClass} />;
      case 'text':
        return <FileText className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const handleTogglePin = async (documentItem: DocumentItem) => {
    try {
      const newPinStatus = !documentItem.is_pinned;
      
      const { error } = await supabase
        .from('documents')
        .update({ is_pinned: newPinStatus })
        .eq('id', documentItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document ${newPinStatus ? 'pinned' : 'unpinned'} successfully`
      });
      
      onDocumentUpdated?.();
    } catch (error) {
      console.error('Pin toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to update document pin status",
        variant: "destructive"
      });
    }
  };

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

  const handlePinToBulletin = (document: DocumentItem) => {
    setDocumentToPin(document);
    setShowPinDialog(true);
  };

  const handlePinDialogClose = () => {
    setShowPinDialog(false);
    setDocumentToPin(null);
  };

  const handlePostCreated = () => {
    onBulletinPostCreated?.();
  };

  return (
    <>
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 text-sm">
          <Folder className="h-4 w-4" />
          <span className="font-semibold">
            Folder: {currentFolder ? <span>{currentFolder}</span> : <span className="italic text-gray-400">None</span>}
          </span>
        </span>
      </div>
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
            sortedDocuments.map((document) => (
              <TableRow 
                key={document.id}
                className={document.is_pinned ? "bg-primary/5 border-primary/20" : ""}
              >
                <TableCell className="flex items-center gap-2">
                  {getFileIcon(document.title)}
                  {document.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                  <span className="line-clamp-1">{document.title}</span>
                  {document.is_pinned && (
                    <span className="text-xs bg-primary/10 text-primary px-1 rounded">Pinned</span>
                  )}
                </TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>{document.file_type.split('/')[1]?.toUpperCase?.() || "-"}</TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>{formatFileSize(document.size_bytes)}</TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>{new Date(document.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  {canPinDocuments && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleTogglePin(document)}
                      title={document.is_pinned ? "Unpin Document" : "Pin Document"}
                      className={document.is_pinned ? "text-primary border-primary" : ""}
                    >
                      {document.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                  )}
                  {canPinToBulletin && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePinToBulletin(document)}
                      title="Pin to Bulletin Board"
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  )}
                  <DocumentViewer
                    documentPath={document.file_path}
                    documentName={document.title}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      title="View Document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DocumentViewer>
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


      <PinToBulletinDialog
        isOpen={showPinDialog}
        onClose={handlePinDialogClose}
        document={documentToPin}
        onPostCreated={handlePostCreated}
      />
    </>
  );
};

export default DocumentList;
