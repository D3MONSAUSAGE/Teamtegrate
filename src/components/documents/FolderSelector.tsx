import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Share2, Settings, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFolders } from '@/hooks/documents/useFolders';
import { FolderManagementModal } from './FolderManagementModal';
import FolderShareDialog from './FolderShareDialog';

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
  
  const { folders: dbFolders } = useFolders(selectedTeamId);

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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleShareFolder(folder.name)}
                className="shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {/* Legacy string folders */}
          {folders.filter(f => !dbFolders.some(df => df.name === f)).map((folder) => (
            <div key={folder} className="flex items-center gap-2">
              <Button
                variant={selectedFolder === folder ? 'default' : 'ghost'}
                className="flex-1 justify-start"
                onClick={() => onSelectFolder(folder)}
              >
                📂 {folder}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleShareFolder(folder)}
                className="shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Create New Folder */}
        <div className="flex gap-2">
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1"
          />
          <Button 
            onClick={handleCreate} 
            size="sm"
            disabled={!newFolderName.trim()}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
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
      </CardContent>
    </Card>
  );
};

export default FolderSelector;