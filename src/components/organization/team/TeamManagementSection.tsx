
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit3,
  UserPlus,
  Loader2,
  UserCog,
  Copy,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import TeamMemberManagementDialog from './TeamMemberManagementDialog';
import TeamMembersHorizontalList from './TeamMembersHorizontalList';
import EditTeamDialog from './EditTeamDialog';
import CreateTeamDialog from './CreateTeamDialog';
import DeleteTeamDialog from './DeleteTeamDialog';
import { Team } from '@/types/teams';

const TeamManagementSection = () => {
  const { user } = useAuth();
  const { teams, isLoading, error, deleteTeam, createTeam } = useTeamManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const canManageTeams = user && ['superadmin', 'admin'].includes(user.role);

  const filteredTeams = teams.filter((team: Team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setIsDeletingTeam(true);
    try {
      await deleteTeam(teamToDelete.id);
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const handleDuplicateTeam = async (team: Team) => {
    try {
      await createTeam({
        name: `${team.name} (Copy)`,
        description: team.description,
        manager_id: team.manager_id,
      });
      toast.success('Team duplicated successfully');
    } catch (error) {
      console.error('Error duplicating team:', error);
      toast.error('Failed to duplicate team');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeams.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedTeams.size} team(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedTeams).map(teamId => deleteTeam(teamId));
      await Promise.all(deletePromises);
      setSelectedTeams(new Set());
      toast.success(`${selectedTeams.size} teams deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting teams:', error);
      toast.error('Failed to delete some teams');
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    const newSelection = new Set(selectedTeams);
    if (newSelection.has(teamId)) {
      newSelection.delete(teamId);
    } else {
      newSelection.add(teamId);
    }
    setSelectedTeams(newSelection);
  };

  const selectAllTeams = () => {
    if (selectedTeams.size === filteredTeams.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(filteredTeams.map(team => team.id)));
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
              Failed to load teams: {String(error)}
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
            <div className="flex items-center gap-2">
              {selectedTeams.size > 0 && canManageTeams && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedTeams.size})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTeams(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
              {canManageTeams && (
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              )}
            </div>
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
            {canManageTeams && filteredTeams.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllTeams}
              >
                {selectedTeams.size === filteredTeams.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
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
                <Card 
                  key={team.id} 
                  className={`hover:shadow-md transition-all ${
                    selectedTeams.has(team.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {canManageTeams && (
                          <input
                            type="checkbox"
                            checked={selectedTeams.has(team.id)}
                            onChange={() => toggleTeamSelection(team.id)}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          {team.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {team.description}
                            </p>
                          )}
                        </div>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDuplicateTeam(team)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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

      {/* Enhanced Create Team Dialog */}
      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

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

      {/* Delete Team Confirmation Dialog */}
      <DeleteTeamDialog
        team={teamToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteTeam}
        isDeleting={isDeletingTeam}
      />

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
