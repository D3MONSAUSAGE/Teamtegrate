import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import FolderSelector from '@/components/documents/FolderSelector';
import DocumentSearch from '@/components/documents/DocumentSearch';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useTeamDocuments } from '@/hooks/documents/useTeamDocuments';
import TeamSelect from '@/components/ui/team-select';

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();

  const canAccessDocuments = hasRoleAccess(user?.role, 'user');
  const canPinDocuments = hasRoleAccess(user?.role, 'manager');
  const isAdmin = hasRoleAccess(user?.role, 'admin');

  const { teams, isLoading: teamsLoading } = useTeamManagement();
  const { documents, folders, isLoading: documentsLoading, error, refetch, createFolder } = useTeamDocuments(selectedTeamId);

  const handleCreateFolder = (folderName: string) => {
    createFolder(folderName, selectedTeamId);
  };

  const handleFolderShared = () => {
    refetch();
  };

  // Filter documents based on folder and search
  const filteredDocs = useMemo(() => {
    let filtered = documents;

    // Filter by folder
    if (selectedFolder !== 'All') {
      filtered = filtered.filter(doc => doc.folder === selectedFolder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        (doc.folder && doc.folder.toLowerCase().includes(query))
      );
    }

    // Sort by pinned status and then by creation date
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [documents, selectedFolder, searchQuery]);


  if (!canAccessDocuments) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have access to documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      
      <div className="space-y-6">
        {isAdmin && (
          <div className="mb-4">
            <TeamSelect
              teams={teams}
              isLoading={teamsLoading}
              selectedTeam={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              optional
            />
          </div>
        )}
        
        <FolderSelector
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onCreateFolder={handleCreateFolder}
          onFolderShared={handleFolderShared}
          selectedTeamId={selectedTeamId}
        />
        
        <div className="flex gap-4">
          <div className="flex-1">
            <DocumentSearch 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          <DocumentUploader 
            folder={selectedFolder === 'All' ? undefined : selectedFolder}
            teamId={selectedTeamId}
            onUploadComplete={refetch}
          />
        </div>

        <DocumentList 
          documents={filteredDocs}
          onDocumentDeleted={refetch}
          onDocumentUpdated={refetch}
          isLoading={documentsLoading}
          currentFolder={selectedFolder}
        />
        
        {error && (
          <div className="text-destructive p-4 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;