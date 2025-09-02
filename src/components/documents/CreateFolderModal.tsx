import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FolderPlus, Building2, Users, Globe, Check } from 'lucide-react';
import { useFolders } from '@/hooks/documents/useFolders';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';
import { toast } from 'sonner';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId?: string;
  onFolderCreated?: () => void;
}

const colorOptions = [
  { name: 'Primary', value: 'hsl(var(--primary))' },
  { name: 'Success', value: 'hsl(var(--success))' },
  { name: 'Warning', value: 'hsl(var(--warning))' },
  { name: 'Blue', value: 'hsl(217 91% 60%)' },
  { name: 'Purple', value: 'hsl(271 91% 65%)' },
  { name: 'Pink', value: 'hsl(330 81% 60%)' },
  { name: 'Orange', value: 'hsl(25 95% 53%)' },
  { name: 'Teal', value: 'hsl(172 66% 50%)' },
];

const quickTemplates = [
  { name: 'Project Documents', description: 'For project-related files and resources' },
  { name: 'Resources', description: 'Shared resources and references' },
  { name: 'Archive', description: 'Completed or inactive documents' },
  { name: 'Training Materials', description: 'Educational content and guides' },
];

export const CreateFolderModal = ({ 
  isOpen, 
  onClose, 
  selectedTeamId, 
  onFolderCreated 
}: CreateFolderModalProps) => {
  const { user } = useAuth();
  const { hasRoleAccess } = useRoleAccess(user);
  const { teams, isLoading: teamsLoading } = useTeams();
  const { createFolder } = useFolders(selectedTeamId);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'hsl(var(--primary))',
    teamId: selectedTeamId || ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Determine if user can assign folders to teams
  const canAssignToTeams = hasRoleAccess('team_leader');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        color: 'hsl(var(--primary))',
        teamId: selectedTeamId || ''
      });
    }
  }, [isOpen, selectedTeamId]);

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    setIsCreating(true);
    try {
      const teamIdToUse = formData.teamId === 'all' ? undefined : formData.teamId || undefined;
      await createFolder(formData.name, formData.description, formData.color, teamIdToUse);
      
      onFolderCreated?.();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        color: 'hsl(var(--primary))',
        teamId: selectedTeamId || ''
      });
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = (template: typeof quickTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description
    }));
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  // Get team name for display
  const getTeamName = (teamId?: string) => {
    if (!teamId || teamId === 'all') return 'Organization-wide';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const getVisibilityInfo = () => {
    const teamId = formData.teamId;
    if (!teamId || teamId === 'all') {
      return {
        icon: <Globe className="h-4 w-4" />,
        text: 'Organization-wide',
        description: 'Visible to all members in your organization'
      };
    }
    
    const team = teams.find(t => t.id === teamId);
    return {
      icon: <Users className="h-4 w-4" />,
      text: team?.name || 'Team',
      description: `Only visible to ${team?.name || 'team'} members`
    };
  };

  const visibility = getVisibilityInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Quick Templates */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Quick Templates</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {quickTemplates.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div>
                    <div className="font-medium text-xs">{template.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name *</Label>
              <Input
                id="folderName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter folder name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="folderDescription">Description</Label>
              <Textarea
                id="folderDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Team Selection */}
            {canAssignToTeams && (
              <div>
                <Label>Visibility</Label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {/* Organization-wide option */}
                  <Button
                    type="button"
                    variant={!formData.teamId || formData.teamId === 'all' ? 'default' : 'outline'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setFormData(prev => ({ ...prev, teamId: 'all' }))}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Organization-wide</div>
                        <div className="text-xs text-muted-foreground">Visible to all members</div>
                      </div>
                      {(!formData.teamId || formData.teamId === 'all') && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </div>
                  </Button>

                  {/* Team options */}
                  {!teamsLoading && teams.map((team) => (
                    <Button
                      key={team.id}
                      type="button"
                      variant={formData.teamId === team.id ? 'default' : 'outline'}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setFormData(prev => ({ ...prev, teamId: team.id }))}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{team.name}</div>
                          <div className="text-xs text-muted-foreground">Team only</div>
                        </div>
                        {formData.teamId === team.id && (
                          <Check className="h-4 w-4 ml-auto" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Selection Display */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                {visibility.icon}
                <div>
                  <div className="font-medium text-sm">{visibility.text}</div>
                  <div className="text-xs text-muted-foreground">{visibility.description}</div>
                </div>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === color.value 
                        ? 'border-foreground ring-2 ring-primary/20' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 pt-4 border-t flex-shrink-0">
          <Button 
            onClick={handleCreateFolder} 
            disabled={!formData.name.trim() || isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Creating...
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};