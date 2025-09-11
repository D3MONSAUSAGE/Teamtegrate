import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

interface EnhancedTeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

export const EnhancedTeamSelector: React.FC<EnhancedTeamSelectorProps> = ({
  selectedTeamId,
  onTeamChange
}) => {
  const { user } = useAuth();
  const { teams, isLoading } = useTeamQueries();

  if (!user) return null;

  const isAdminOrSuperAdmin = hasRoleAccess(user.role, 'admin');
  const isManager = user.role === 'manager';

  // For managers, filter to only teams they manage
  const availableTeams = React.useMemo(() => {
    if (isAdminOrSuperAdmin) {
      return teams;
    }
    if (isManager) {
      return teams.filter(team => team.manager_id === user.id);
    }
    return [];
  }, [teams, isAdminOrSuperAdmin, isManager, user.id]);

  // Auto-select team for managers if they have only one team
  React.useEffect(() => {
    if (isManager && availableTeams.length === 1 && !selectedTeamId) {
      onTeamChange(availableTeams[0].id);
    }
  }, [isManager, availableTeams, selectedTeamId, onTeamChange]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Loading teams...</span>
        </CardContent>
      </Card>
    );
  }

  if (availableTeams.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isManager ? "No teams assigned to manage" : "No teams available"}
          </span>
        </CardContent>
      </Card>
    );
  }

  // For managers with only one team, show the team name instead of selector
  if (isManager && availableTeams.length === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team Reports - {availableTeams[0].name}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // For admins/superadmins or managers with multiple teams
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team Filter
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Select Team:</span>
            <Select
              value={selectedTeamId || ''}
              onValueChange={(value) => onTeamChange(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {/* All Teams option for admins/superadmins */}
                {isAdminOrSuperAdmin && (
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Teams
                    </div>
                  </SelectItem>
                )}
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{team.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {team.member_count} members
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};