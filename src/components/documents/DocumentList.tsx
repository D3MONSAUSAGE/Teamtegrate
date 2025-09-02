
import React from 'react';
import { Loader2, FolderOpen } from 'lucide-react';
import DocumentCard from './DocumentCard';
import PinToBulletinDialog from './PinToBulletinDialog';
import { DocumentCardSkeleton } from '@/components/ui/loading-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';

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
  const [showPinDialog, setShowPinDialog] = React.useState(false);
  const [documentToPin, setDocumentToPin] = React.useState<DocumentItem | null>(null);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (sortedDocuments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {currentFolder === 'All' 
            ? "No documents have been uploaded yet. Upload your first document to get started."
            : `No documents found in the "${currentFolder}" folder. Try selecting a different folder or upload new documents.`
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>
            Viewing: <span className="font-semibold text-foreground">
              {currentFolder || "All Documents"}
            </span>
          </span>
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            {sortedDocuments.length} {sortedDocuments.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sortedDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onDocumentDeleted={onDocumentDeleted}
            onDocumentUpdated={onDocumentUpdated}
            onPinToBulletin={canPinToBulletin ? handlePinToBulletin : undefined}
            canPin={canPinDocuments}
            canPinToBulletin={canPinToBulletin}
          />
        ))}
      </div>

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
