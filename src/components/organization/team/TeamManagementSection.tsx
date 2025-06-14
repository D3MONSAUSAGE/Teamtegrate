
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Loader2, 
  Crown,
  UserCheck,
  TrendingUp 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import TeamCard from './TeamCard';
import CreateTeamDialog from './CreateTeamDialog';
import ManageTeamMembersDialog from './ManageTeamMembersDialog';
import { Team } from '@/types/teams';

const TeamManagementSection: React.FC = () => {
  const { user } = useAuth();
  const { teams, teamStats, isLoading, error } = useTeamManagement();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canCreateTeams = user?.role && ['superadmin', 'admin'].includes(user.role);

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
            <Loader2 className="h-8 w-8 animate-spin" />
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
          <p className="text-destructive text-center py-4">
            Failed to load teams. Please try again.
          </p>
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
              <Badge variant="outline" className="ml-auto">
                {teams.length} Team{teams.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            
            {canCreateTeams && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
          
          {/* Team Stats */}
          {teamStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Teams</span>
                </div>
                <p className="text-2xl font-bold mt-1">{teamStats.total_teams}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">With Managers</span>
                </div>
                <p className="text-2xl font-bold mt-1">{teamStats.teams_with_managers}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Total Members</span>
                </div>
                <p className="text-2xl font-bold mt-1">{teamStats.total_team_members}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Avg. Size</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {teamStats.average_team_size ? Math.round(teamStats.average_team_size * 10) / 10 : '0'}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first team to organize your workforce
              </p>
              {canCreateTeams && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Team
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={(team) => {
                    // TODO: Implement edit dialog
                    console.log('Edit team:', team);
                  }}
                  onDelete={(team) => {
                    // TODO: Implement delete confirmation
                    console.log('Delete team:', team);
                  }}
                  onManageMembers={(team) => {
                    // TODO: Implement member management dialog
                    console.log('Manage members:', team);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
};

export default TeamManagementSection;
