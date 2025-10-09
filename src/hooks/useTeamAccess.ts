import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { Team } from '@/types/teams';

export interface TeamAccessInfo {
  availableTeams: Team[];
  canManageTeam: (teamId: string) => boolean;
  shouldAutoSelect: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
}

export const useTeamAccess = (): TeamAccessInfo & {
  teams: Team[];
  isLoading: boolean;
  error: any;
  teamStats: any;
} => {
  const { user } = useAuth();
  const { teams, isLoading, error, teamStats } = useTeamQueries();

  const accessInfo = useMemo(() => {
    if (!user) {
      return {
        availableTeams: [],
        canManageTeam: () => false,
        shouldAutoSelect: false,
        isAdmin: false,
        isManager: false,
        isSuperAdmin: false,
      };
    }

    const isAdmin = hasRoleAccess(user.role, 'admin');
    const isSuperAdmin = user.role === 'superadmin';
    const isManager = user.role === 'manager';

    // For admins/superadmins, show all teams
    // For managers, show teams they manage (either as manager_id or team_memberships.role = 'manager')
    const availableTeams = isAdmin 
      ? teams 
      : teams.filter(team => 
          team.manager_id === user.id || 
          team.user_team_role === 'manager'
        );

    const canManageTeam = (teamId: string) => {
      if (isAdmin) return true;
      return teams.some(team => 
        team.id === teamId && 
        (team.manager_id === user.id || team.user_team_role === 'manager')
      );
    };

    // Should auto-select only for managers with exactly one team
    const shouldAutoSelect = isManager && availableTeams.length === 1;

    return {
      availableTeams,
      canManageTeam,
      shouldAutoSelect,
      isAdmin,
      isManager,
      isSuperAdmin,
    };
  }, [user, teams]);

  return {
    ...accessInfo,
    teams,
    isLoading,
    error,
    teamStats,
  };
};