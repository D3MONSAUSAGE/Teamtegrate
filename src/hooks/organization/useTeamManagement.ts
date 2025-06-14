
import { useTeamQueries } from './team/useTeamQueries';
import { useTeamOperations } from './team/useTeamOperations';
import { useTeamMemberOperations } from './team/useTeamMemberOperations';

export const useTeamManagement = () => {
  const { teams, teamStats, isLoading, error } = useTeamQueries();
  const { isCreating, isUpdating, createTeam, updateTeam, deleteTeam, refetchTeams } = useTeamOperations();
  const { addTeamMember, removeTeamMember } = useTeamMemberOperations();

  return {
    teams,
    teamStats,
    isLoading,
    error,
    isCreating,
    isUpdating,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    refetchTeams,
  };
};
