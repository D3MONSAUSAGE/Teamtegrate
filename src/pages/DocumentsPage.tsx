import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import FolderSelector from '@/components/documents/FolderSelector';
import DocumentSearch from '@/components/documents/DocumentSearch';
import { CreateFolderModal } from '@/components/documents/CreateFolderModal';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useTeamDocuments } from '@/hooks/documents/useTeamDocuments';
import { TeamSelect } from '@/components/ui/team-select';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

  const canAccessDocuments = hasRoleAccess(user?.role, 'user');
  const canPinDocuments = hasRoleAccess(user?.role, 'manager');
  const isAdmin = hasRoleAccess(user?.role, 'admin');

  const { teams, isLoading: teamsLoading } = useTeamManagement();
  const { documents, folders, isLoading: documentsLoading, error, refetch, createFolder } = useTeamDocuments(selectedTeamId);

  // Auto-select team if user belongs to only one team
  React.useEffect(() => {
    if (!isAdmin && teams && teams.length === 1 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, isAdmin, selectedTeamId]);

  // Reset folder selection when team changes
  React.useEffect(() => {
    setSelectedFolder('All');
  }, [selectedTeamId]);

  // Get selected team info
  const selectedTeam = teams?.find(team => team.id === selectedTeamId);
  
  // Check if user can create folders in selected team
  const canCreateFolders = selectedTeamId && (
    isAdmin || 
    (selectedTeam && user?.id === selectedTeam.manager_id) ||
    hasRoleAccess(user?.role, 'manager')
  );

  const handleCreateFolder = (folderName: string) => {
    createFolder(folderName, selectedTeamId);
  };

  const handleFolderShared = () => {
    refetch();
  };

  const handleFolderCreated = () => {
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

  // Step-based workflow states
  const isTeamSelected = Boolean(selectedTeamId);
  const canProceedToFolders = isTeamSelected;
  const canProceedToDocuments = isTeamSelected;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Organization</span>
            {selectedTeam && (
              <>
                <span>→</span>
                <span className="text-foreground font-medium">{selectedTeam.name}</span>
              </>
            )}
            {selectedFolder !== 'All' && selectedTeam && (
              <>
                <span>→</span>
                <span className="text-foreground font-medium">{selectedFolder}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Step 1: Team Selection - Always visible and required */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isTeamSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                Select Team
              </h2>
              <p className="text-sm text-muted-foreground">Choose which team's documents you want to manage</p>
            </div>
            {isTeamSelected && (
              <div className="text-green-600 text-sm font-medium">✓ Team Selected</div>
            )}
          </div>
          
          <TeamSelect
            teams={teams}
            isLoading={teamsLoading}
            selectedTeam={selectedTeamId}
            onTeamChange={setSelectedTeamId}
            optional={false}
          />
        </div>

        {/* Step 2: Folder Management - Only show when team is selected */}
        {canProceedToFolders && (
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  Manage Folders
                  <span className="text-sm text-muted-foreground font-normal">in {selectedTeam?.name}</span>
                </h2>
                <p className="text-sm text-muted-foreground">Select a folder or create a new one</p>
              </div>
              {canCreateFolders && (
                <Button 
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create Folder
                </Button>
              )}
            </div>
            
            <FolderSelector
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              onCreateFolder={handleCreateFolder}
              onFolderShared={handleFolderShared}
              selectedTeamId={selectedTeamId}
            />
          </div>
        )}

        {/* Step 3: Document Management - Only show when team is selected */}
        {canProceedToDocuments && (
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  Upload & Manage Documents
                </h2>
                <p className="text-sm text-muted-foreground">
                  Uploading to: <span className="font-medium text-foreground">{selectedTeam?.name}</span>
                  {selectedFolder !== 'All' && (
                    <> → <span className="font-medium text-foreground">{selectedFolder}</span></>
                  )}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <DocumentSearch 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
                <DocumentUploader 
                  folder={selectedFolder === 'All' ? undefined : selectedFolder}
                  teamId={selectedTeamId === 'all' ? undefined : selectedTeamId}
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
            </div>
          </div>
        )}

        {/* Show message when no team is selected */}
        {!isTeamSelected && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Please select a team to continue managing documents.</p>
          </div>
        )}
        
        {error && (
          <div className="text-destructive p-4 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <CreateFolderModal
          isOpen={isCreateFolderModalOpen}
          onClose={() => setIsCreateFolderModalOpen(false)}
          selectedTeamId={selectedTeamId}
          onFolderCreated={handleFolderCreated}
        />
      </div>
    </div>
  );
};

export default DocumentsPage;