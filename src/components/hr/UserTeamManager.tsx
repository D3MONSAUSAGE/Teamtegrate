import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Users, Plus, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UserTeamManagerProps {
  userId: string;
  userName: string;
}

interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: 'manager' | 'member';
  teams: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

export const UserTeamManager: React.FC<UserTeamManagerProps> = ({ userId, userName }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member'>('member');

  // Fetch user's current team memberships
  const { data: userTeams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['user-team-memberships', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          id,
          team_id,
          user_id,
          role,
          teams:teams(id, name, description)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data as TeamMembership[];
    },
  });

  // Fetch all available teams in organization
  const { data: allTeams = [] } = useQuery({
    queryKey: ['all-teams', currentUser?.organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description')
        .eq('organization_id', currentUser?.organizationId!)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organizationId,
  });

  // Add team membership mutation
  const addTeamMutation = useMutation({
    mutationFn: async ({ teamId, role }: { teamId: string; role: 'manager' | 'member' }) => {
      const { data, error } = await supabase
        .from('team_memberships')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-team-memberships', userId] });
      toast.success('Team membership added successfully');
      setSelectedTeamId('');
      setSelectedRole('member');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add team membership');
    },
  });

  // Remove team membership mutation
  const removeTeamMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-team-memberships', userId] });
      toast.success('Team membership removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove team membership');
    },
  });

  // Update team role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, newRole }: { membershipId: string; newRole: 'manager' | 'member' }) => {
      const { error } = await supabase
        .from('team_memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-team-memberships', userId] });
      toast.success('Team role updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update team role');
    },
  });

  const availableTeams = allTeams.filter(
    team => !userTeams.some(ut => ut.team_id === team.id)
  );

  const handleAddTeam = () => {
    if (!selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    addTeamMutation.mutate({ teamId: selectedTeamId, role: selectedRole });
  };

  const canManageTeams = currentUser?.role && ['admin', 'superadmin', 'manager'].includes(currentUser.role);

  if (!canManageTeams) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Memberships - {userName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Teams */}
        <div className="space-y-3">
          <h4 className="font-medium">Current Teams</h4>
          {isLoadingTeams ? (
            <p className="text-sm text-muted-foreground">Loading teams...</p>
          ) : userTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team memberships</p>
          ) : (
            <div className="space-y-2">
              {userTeams.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{membership.teams?.name}</span>
                        <Badge 
                          variant={membership.role === 'manager' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {membership.role === 'manager' ? (
                            <><Crown className="h-3 w-3 mr-1" /> Manager</>
                          ) : (
                            <><Shield className="h-3 w-3 mr-1" /> Member</>
                          )}
                        </Badge>
                      </div>
                      {membership.teams?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {membership.teams.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={membership.role}
                      onValueChange={(value) => 
                        updateRoleMutation.mutate({ 
                          membershipId: membership.id, 
                          newRole: value as 'manager' | 'member' 
                        })
                      }
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeTeamMutation.mutate(membership.id)}
                      disabled={removeTeamMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Team */}
        {availableTeams.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Add to Team</h4>
            <div className="flex items-center gap-2">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-muted-foreground">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'manager' | 'member')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddTeam}
                disabled={!selectedTeamId || addTeamMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                {addTeamMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
