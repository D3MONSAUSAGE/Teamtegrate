import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, FolderPlus, Palette } from 'lucide-react';
import { useFolders, type Folder } from '@/hooks/documents/useFolders';
import { toast } from 'sonner';

interface FolderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId?: string;
}

const colorOptions = [
  { name: 'Blue', value: '#6366f1' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
];

export const FolderManagementModal = ({ isOpen, onClose, selectedTeamId }: FolderManagementModalProps) => {
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders(selectedTeamId);
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      await createFolder(formData.name, formData.description, formData.color, selectedTeamId);
      setFormData({ name: '', description: '', color: '#6366f1' });
      setIsCreating(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !formData.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      await updateFolder(editingFolder.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color
      });
      setEditingFolder(null);
      setFormData({ name: '', description: '', color: '#6366f1' });
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (window.confirm(`Are you sure you want to delete "${folder.name}"? This action cannot be undone.`)) {
      try {
        await deleteFolder(folder.id);
      } catch (error) {
        // Error already handled in hook
      }
    }
  };

  const startEditing = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || '',
      color: folder.color
    });
    setIsCreating(false);
  };

  const cancelEditing = () => {
    setEditingFolder(null);
    setIsCreating(false);
    setFormData({ name: '', description: '', color: '#6366f1' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Folders</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          {(isCreating || editingFolder) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingFolder ? 'Edit Folder' : 'Create New Folder'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Name</Label>
                  <Input
                    id="folderName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="folderDescription">Description (optional)</Label>
                  <Textarea
                    id="folderDescription"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter folder description"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        className={`w-6 h-6 rounded-full border-2 ${
                          formData.color === color.value ? 'border-foreground' : 'border-muted'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}>
                    {editingFolder ? 'Update Folder' : 'Create Folder'}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Button */}
          {!isCreating && !editingFolder && (
            <Button 
              onClick={() => setIsCreating(true)}
              className="w-full"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create New Folder
            </Button>
          )}

          {/* Folders List */}
          <div className="space-y-3">
            <h3 className="font-medium">Existing Folders ({folders.length})</h3>
            {folders.map((folder) => (
              <Card key={folder.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      <div>
                        <h4 className="font-medium">{folder.name}</h4>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground">{folder.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(folder)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteFolder(folder)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {folders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No folders created yet. Create your first folder above.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};