
import React, { useEffect, useState, useMemo } from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import FolderSelector from '@/components/documents/FolderSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  created_at: string;
  size_bytes: number;
  folder?: string | null;
}

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast.error('Error loading documents');
        return;
      }

      setDocuments(data || []);

      // Folder extraction (unique non-empty folder names)
      const folderList = (data || [])
        .map((doc) => doc.folder || "")
        .filter((f, i, arr) => f && arr.indexOf(f) === i)
        .sort((a, b) => a.localeCompare(b));
      setFolders(folderList);

      // If current folder was removed, reset to ""
      if (selectedFolder && !folderList.includes(selectedFolder)) {
        setSelectedFolder("");
      }
    } catch (err) {
      console.error('Exception fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new folder to state (no backend needed, only meta)
  const handleCreateFolder = (folderName: string) => {
    if (folders.includes(folderName)) return;
    setFolders([...folders, folderName]);
    setSelectedFolder(folderName);
    toast.success(`Folder "${folderName}" created`);
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Memo: filter docs by selected folder
  const filteredDocs = useMemo(() => {
    if (!selectedFolder) return documents;
    return documents.filter((doc) => doc.folder === selectedFolder);
  }, [documents, selectedFolder]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <FolderSelector
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={handleCreateFolder}
      />
      <div className="space-y-6">
        <DocumentUploader
          onUploadComplete={fetchDocuments}
          folder={selectedFolder}
        />
        <DocumentList
          documents={filteredDocs}
          onDocumentDeleted={fetchDocuments}
          isLoading={isLoading}
          currentFolder={selectedFolder}
        />
      </div>
    </div>
  );
};

export default DocumentsPage;
