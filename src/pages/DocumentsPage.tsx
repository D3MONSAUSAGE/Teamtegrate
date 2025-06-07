
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
  const [sharedFolders, setSharedFolders] = useState<string[]>([]);
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

      // Extract owned folders (non-empty folder names from user's documents)
      const ownedFolderList = (data || [])
        .map((doc) => doc.folder || "")
        .filter((f, i, arr) => f && arr.indexOf(f) === i)
        .sort((a, b) => a.localeCompare(b));

      // Fetch shared folders
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_folders')
        .select('folder_name')
        .eq('shared_with_user_id', user.id);

      if (sharedError) {
        console.error('Error fetching shared folders:', sharedError);
      }

      const sharedFolderList = (sharedData || [])
        .map((sf) => sf.folder_name)
        .filter((f, i, arr) => f && arr.indexOf(f) === i)
        .sort((a, b) => a.localeCompare(b));

      // Combine owned and shared folders for display
      const allFolders = [...ownedFolderList, ...sharedFolderList]
        .filter((f, i, arr) => arr.indexOf(f) === i)
        .sort((a, b) => a.localeCompare(b));

      setFolders(allFolders);
      setSharedFolders(sharedFolderList);

      // If current folder was removed, reset to ""
      if (selectedFolder && !allFolders.includes(selectedFolder)) {
        setSelectedFolder("");
      }
    } catch (err) {
      console.error('Exception fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents from shared folders
  const fetchSharedDocuments = async () => {
    if (!user || sharedFolders.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .in('folder', sharedFolders)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shared documents:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching shared documents:', err);
      return [];
    }
  };

  // Add new folder to state (no backend needed, only meta)
  const handleCreateFolder = (folderName: string) => {
    if (folders.includes(folderName)) return;
    setFolders([...folders, folderName]);
    setSelectedFolder(folderName);
    toast.success(`Folder "${folderName}" created`);
  };

  const handleFolderShared = () => {
    // Refresh the folders and documents when sharing changes
    fetchDocuments();
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Memo: filter docs by selected folder, including shared documents
  const filteredDocs = useMemo(async () => {
    let baseDocuments = documents;
    
    // If we have shared folders, also include documents from those folders
    if (sharedFolders.length > 0) {
      const sharedDocs = await fetchSharedDocuments();
      baseDocuments = [...documents, ...sharedDocs];
    }

    if (!selectedFolder) return baseDocuments;
    return baseDocuments.filter((doc) => doc.folder === selectedFolder);
  }, [documents, selectedFolder, sharedFolders]);

  // Use state for the filtered documents since we need async operation
  const [displayDocuments, setDisplayDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    const updateDisplayDocuments = async () => {
      const filtered = await filteredDocs;
      setDisplayDocuments(filtered);
    };
    updateDisplayDocuments();
  }, [filteredDocs]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <FolderSelector
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={handleCreateFolder}
        sharedFolders={sharedFolders}
        onFolderShared={handleFolderShared}
      />
      <div className="space-y-6">
        <DocumentUploader
          onUploadComplete={fetchDocuments}
          folder={selectedFolder}
        />
        <DocumentList
          documents={displayDocuments}
          onDocumentDeleted={fetchDocuments}
          isLoading={isLoading}
          currentFolder={selectedFolder}
        />
      </div>
    </div>
  );
};

export default DocumentsPage;
