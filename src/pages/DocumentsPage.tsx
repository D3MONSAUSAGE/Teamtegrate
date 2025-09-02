
import React, { useEffect, useState, useMemo } from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import FolderSelector from '@/components/documents/FolderSelector';
import DocumentSearch from '@/components/documents/DocumentSearch';
import BulletinBoard from '@/components/documents/BulletinBoard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';
import { toast } from 'sonner';

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

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [sharedFolders, setSharedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("bulletin");
  const { user } = useAuth();
  const { hasRoleAccess } = useRoleAccess(user);
  
  const canAccessDocuments = hasRoleAccess('manager');

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

  // Memo: filter docs by selected folder and search query, including shared documents
  const filteredDocs = useMemo(async () => {
    let baseDocuments = documents;
    
    // If we have shared folders, also include documents from those folders
    if (sharedFolders.length > 0) {
      const sharedDocs = await fetchSharedDocuments();
      baseDocuments = [...documents, ...sharedDocs];
    }

    // Filter by folder
    if (selectedFolder) {
      baseDocuments = baseDocuments.filter((doc) => doc.folder === selectedFolder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      baseDocuments = baseDocuments.filter((doc) => 
        doc.title.toLowerCase().includes(query) ||
        doc.file_type.toLowerCase().includes(query) ||
        (doc.folder && doc.folder.toLowerCase().includes(query))
      );
    }

    // Sort documents: pinned first, then by creation date
    baseDocuments.sort((a, b) => {
      // First sort by pinned status (pinned first)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return baseDocuments;
  }, [documents, selectedFolder, sharedFolders, searchQuery]);

  // Use state for the filtered documents since we need async operation
  const [displayDocuments, setDisplayDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    const updateDisplayDocuments = async () => {
      const filtered = await filteredDocs;
      setDisplayDocuments(filtered);
    };
    updateDisplayDocuments();
  }, [filteredDocs]);

  // Set initial tab based on user role
  useEffect(() => {
    if (!canAccessDocuments) {
      setActiveTab("bulletin");
    } else if (activeTab === "bulletin" && canAccessDocuments) {
      // Keep bulletin as default for all users
      setActiveTab("bulletin");
    }
  }, [canAccessDocuments]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">
        {canAccessDocuments ? "Documents & Bulletin Board" : "Bulletin Board"}
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bulletin">Bulletin Board</TabsTrigger>
          {canAccessDocuments && (
            <TabsTrigger value="documents">Documents</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="bulletin" className="mt-6">
          <BulletinBoard />
        </TabsContent>

        {canAccessDocuments && (
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-6">
              <FolderSelector
                folders={folders}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
                onCreateFolder={handleCreateFolder}
                sharedFolders={sharedFolders}
                onFolderShared={handleFolderShared}
              />
              
              <DocumentSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              
              <DocumentUploader
                onUploadComplete={fetchDocuments}
                folder={selectedFolder}
              />
              
              <DocumentList 
                documents={displayDocuments} 
                onDocumentDeleted={fetchDocuments}
                onDocumentUpdated={fetchDocuments}
                isLoading={isLoading}
                currentFolder={selectedFolder}
                onBulletinPostCreated={() => {
                  // Refresh bulletin board when a document is pinned
                  // This will be handled by the bulletin board's real-time subscription
                }}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DocumentsPage;
