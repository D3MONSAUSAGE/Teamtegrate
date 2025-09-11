import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateVideoPermissions } from '@/hooks/useVideoLibrary';
import { useToast } from '@/hooks/use-toast';
import { Users, User, Trash2 } from 'lucide-react';

interface VideoPermissionsDialogProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Permission {
  id: string;
  user_id?: string;
  team_id?: string;
  permission_type: 'view' | 'manage';
  user?: User;
  team?: Team;
}

export const VideoPermissionsDialog: React.FC<VideoPermissionsDialogProps> = ({
  videoId,
  open,
  onOpenChange,
}) => {
  const [selectedType, setSelectedType] = useState<'user' | 'team'>('team');
  const [selectedId, setSelectedId] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const updatePermissions = useUpdateVideoPermissions();
  const { toast } = useToast();

  // Fetch current video details
  const { data: video } = useQuery({
    queryKey: ['video-library-item', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_library_items')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!videoId && open,
  });

  // Fetch current permissions
  const { data: currentPermissions } = useQuery({
    queryKey: ['video-permissions', videoId],
    queryFn: async () => {
      const { data: permissionsData, error } = await supabase
        .from('video_library_permissions')
        .select('*')
        .eq('video_id', videoId);

      if (error) throw error;

      // Fetch related user and team data separately
      const permissions = await Promise.all(
        (permissionsData || []).map(async (permission) => {
          let user: User | undefined;
          let team: Team | undefined;

          if (permission.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', permission.user_id)
              .single();
            user = userData || undefined;
          }

          if (permission.team_id) {
            const { data: teamData } = await supabase
              .from('teams')
              .select('id, name, description')
              .eq('id', permission.team_id)
              .single();
            team = teamData || undefined;
          }

          return {
            ...permission,
            user,
            team,
          } as Permission;
        })
      );

      return permissions;
    },
    enabled: !!videoId && open,
  });

  // Update permissions state when data changes
  React.useEffect(() => {
    if (currentPermissions) {
      setPermissions(currentPermissions);
    }
  }, [currentPermissions]);

  // Fetch available teams
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Team[];
    },
    enabled: open,
  });

  // Fetch available users
  const { data: users } = useQuery({
    queryKey: ['organization-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      return data as User[];
    },
    enabled: open,
  });

  const addPermission = () => {
    if (!selectedId) return;

    const newPermission: Permission = {
      id: `temp-${Date.now()}`,
      permission_type: 'view',
      ...(selectedType === 'user' ? { user_id: selectedId } : { team_id: selectedId }),
    };

    if (selectedType === 'user') {
      newPermission.user = users?.find(u => u.id === selectedId);
    } else {
      newPermission.team = teams?.find(t => t.id === selectedId);
    }

    setPermissions([...permissions, newPermission]);
    setSelectedId('');
  };

  const removePermission = (permissionId: string) => {
    setPermissions(permissions.filter(p => p.id !== permissionId));
  };

  const updatePermissionType = (permissionId: string, type: 'view' | 'manage') => {
    setPermissions(permissions.map(p => 
      p.id === permissionId ? { ...p, permission_type: type } : p
    ));
  };

  const handleSave = async () => {
    try {
      const permissionData = permissions.map(p => ({
        user_id: p.user_id,
        team_id: p.team_id,
        permission_type: p.permission_type,
      }));

      await updatePermissions.mutateAsync({
        videoId,
        permissions: permissionData,
      });

      toast({
        title: 'Permissions Updated',
        description: 'Video permissions have been successfully updated',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permissions. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const availableItems = selectedType === 'user' 
    ? users?.filter(u => !permissions.some(p => p.user_id === u.id)) || []
    : teams?.filter(t => !permissions.some(p => p.team_id === t.id)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Video Permissions</DialogTitle>
          <DialogDescription>
            Control who can access "{video?.title}" in your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Add Permission</Label>
            <div className="flex space-x-2">
              <Select value={selectedType} onValueChange={(value: 'user' | 'team') => {
                setSelectedType(value);
                setSelectedId('');
              }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={`Select ${selectedType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {selectedType === 'user' 
                        ? `${(item as User).name} (${(item as User).email})`
                        : (item as Team).name
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={addPermission} disabled={!selectedId}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Current Permissions</Label>
            {permissions.length > 0 ? (
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {permission.user_id ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{permission.user?.name}</div>
                            <div className="text-sm text-muted-foreground">{permission.user?.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{permission.team?.name}</div>
                            {permission.team?.description && (
                              <div className="text-sm text-muted-foreground">{permission.team.description}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select 
                        value={permission.permission_type} 
                        onValueChange={(value: 'view' | 'manage') => updatePermissionType(permission.id, value)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="manage">Manage</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePermission(permission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No permissions set. This video will only be accessible to administrators.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updatePermissions.isPending}>
              {updatePermissions.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};