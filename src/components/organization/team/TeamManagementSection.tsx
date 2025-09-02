
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit3,
  UserPlus,
  Save,
  X,
  Loader2,
  UserCog
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';
import TeamMemberManagementDialog from './TeamMemberManagementDialog';
import TeamMembersHorizontalList from './TeamMembersHorizontalList';
import EditTeamDialog from './EditTeamDialog';

interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  member_count: number;
  is_active: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

const TeamManagementSection = () => {
  const { user } = useAuth();
  const { teams, isLoading, error, refetch } = useTeams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  const canManageTeams = user && ['superadmin', 'admin'].includes(user.role);

  const filteredTeams = teams.filter((team: Team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      devLog.userOperation('Creating team', { name: teamName, description: teamDescription });
      
      const { error } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
          organization_id: user?.organizationId,
          manager_id: user?.id,
          is_active: true
        });

      if (error) throw error;

      toast.success('Team created successfully');
      logger.userAction('Team created', { teamName });
      setIsCreateDialogOpen(false);
      setTeamName('');
      setTeamDescription('');
      refetch();
    } catch (error) {
      logger.error('Error creating team', error);
      toast.error('Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam || !teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      devLog.userOperation('Updating team', { 
        teamId: editingTeam.id, 
        name: teamName, 
        description: teamDescription 
      });
      
      const { error } = await supabase
        .from('teams')
        .update({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
        })
        .eq('id', editingTeam.id);

      if (error) throw error;

      toast.success('Team updated successfully');
      logger.userAction('Team updated', { teamId: editingTeam.id, teamName });
      setIsEditDialogOpen(false);
      setEditingTeam(null);
      setTeamName('');
      setTeamDescription('');
      refetch();
    } catch (error) {
      logger.error('Error updating team', error);
      toast.error('Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      devLog.userOperation('Deleting team', { teamId: team.id, teamName: team.name });
      
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', team.id);

      if (error) throw error;

      toast.success('Team deleted successfully');
      logger.userAction('Team deleted', { teamId: team.id, teamName: team.name });
      refetch();
    } catch (error) {
      logger.error('Error deleting team', error);
      toast.error('Failed to delete team');
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTeam(null);
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team);
    setMemberDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading teams...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Failed to load teams: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
              <Badge variant="outline">
                {filteredTeams.length} Teams
              </Badge>
            </CardTitle>
            {canManageTeams && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Team Name</label>
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Enter team name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description (Optional)</label>
                      <Textarea
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        placeholder="Describe the team's purpose"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTeam} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          'Create Team'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No teams found matching your search.' : 'No teams created yet.'}
              </p>
              {canManageTeams && !searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team: Team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {team.description}
                          </p>
                        )}
                      </div>
                      {canManageTeams && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleManageMembers(team)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(team)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTeam(team)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>{team.member_count} members</span>
                      </div>
                      {team.manager_name && (
                        <span>Manager: {team.manager_name}</span>
                      )}
                    </div>
                    
                    {/* Team Members Horizontal List */}
                    <TeamMembersHorizontalList teamId={team.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Edit Team Dialog */}
      {editingTeam && (
        <EditTeamDialog
          team={{
            ...editingTeam,
            organization_id: editingTeam.organization_id || user?.organizationId || '',
            created_at: editingTeam.created_at || new Date().toISOString(),
            updated_at: editingTeam.updated_at || new Date().toISOString(),
          }}
          open={isEditDialogOpen}
          onOpenChange={closeEditDialog}
        />
      )}

      {/* Team Member Management Dialog */}
      {selectedTeam && (
        <TeamMemberManagementDialog
          team={selectedTeam}
          open={memberDialogOpen}
          onOpenChange={setMemberDialogOpen}
        />
      )}
    </>
  );
};

export default TeamManagementSection;
