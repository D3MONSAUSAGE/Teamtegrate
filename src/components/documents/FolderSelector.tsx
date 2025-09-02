import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Share2, Settings, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFolders } from '@/hooks/documents/useFolders';
import { FolderManagementModal } from './FolderManagementModal';
import FolderShareDialog from './FolderShareDialog';
import { toast } from '@/hooks/use-toast';

interface FolderSelectorProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onCreateFolder: (folderName: string) => void;
  onFolderShared: () => void;
  selectedTeamId?: string;
}

const FolderSelector = ({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onCreateFolder, 
  onFolderShared,
  selectedTeamId
}: FolderSelectorProps) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [folderToShare, setFolderToShare] = useState<string | null>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { folders: dbFolders, migrateLegacyFolders, deleteFolder } = useFolders(selectedTeamId);

  const handleCreate = () => {
    const trimmed = newFolderName.trim();
    if (trimmed && !folders.includes(trimmed)) {
      onCreateFolder(trimmed);
      setNewFolderName('');
    }
  };

  const handleShareFolder = (folderName: string) => {
    setFolderToShare(folderName);
    setIsShareDialogOpen(true);
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      await migrateLegacyFolders();
      // Force refresh after migration
      window.location.reload();
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setFolderToDelete({ id: folderId, name: folderName });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!folderToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteFolder(folderToDelete.id);
      toast({
        title: "Success",
        description: `Folder "${folderToDelete.name}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setFolderToDelete(null);
    }
  };

  // Check if we have legacy folders but no database folders  
  const hasLegacyFolders = folders && folders.length > 0;
  const hasDbFolders = dbFolders && dbFolders.length > 0;
  const shouldShowMigration = hasLegacyFolders && !hasDbFolders;

  // Combine legacy string folders with new database folders
  const allFolders = [...folders, ...dbFolders.map(f => f.name)];
  const uniqueFolders = [...new Set(allFolders)];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Folders</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {uniqueFolders.length} folders
            </Badge>
            {shouldShowMigration && (
              <Button
                onClick={handleMigration}
                disabled={isMigrating}
                variant="default"
                size="sm"
                className="gap-2"
              >
                {isMigrating ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Migrating...
                  </>
                ) : (
                  'Migrate Folders'
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsManagementModalOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Folders
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* All Documents Button */}
        <Button
          variant={selectedFolder === 'All' ? 'default' : 'ghost'}
          className="w-full mb-3 justify-start"
          onClick={() => onSelectFolder('All')}
        >
          📁 All Documents
        </Button>

        {/* Folder List */}
        <div className="space-y-2 mb-4">
          {shouldShowMigration && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 dark:bg-yellow-950/20 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400" />
                Legacy Folders Detected
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                You have {folders?.length} legacy folders that need to be migrated to the new system for better organization and features.
              </p>
              <Button
                onClick={handleMigration}
                disabled={isMigrating}
                size="sm"
                className="w-full"
              >
                {isMigrating ? 'Migrating...' : 'Migrate Now'}
              </Button>
            </div>
          )}

          {dbFolders.map((folder) => (
            <div key={folder.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: folder.color }}
              />
              <Button
                variant={selectedFolder === folder.name ? 'default' : 'ghost'}
                className="flex-1 justify-start"
                onClick={() => onSelectFolder(folder.name)}
              >
                {folder.name}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={() => handleShareFolder(folder.name)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          
          {/* Legacy string folders (only show if migration not available or alongside) */}
          {(!shouldShowMigration || shouldShowMigration) && folders.filter(f => !dbFolders.some(df => df.name === f)).map((folder) => (
            <div key={folder} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 shrink-0" />
              <Button
                variant={selectedFolder === folder ? 'default' : 'ghost'}
                className="flex-1 justify-start"
                onClick={() => onSelectFolder(folder)}
              >
                📂 {folder}
              </Button>
              <Badge variant="outline" className="text-xs px-2 py-1">Legacy</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={() => handleShareFolder(folder)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>


        <FolderShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          folderName={folderToShare || ''}
          onFolderShared={onFolderShared}
        />

        <FolderManagementModal
          isOpen={isManagementModalOpen}
          onClose={() => setIsManagementModalOpen(false)}
          selectedTeamId={selectedTeamId}
        />

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{folderToDelete?.name}"? This action cannot be undone.
                All documents in this folder will be moved to "All Documents".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default FolderSelector;