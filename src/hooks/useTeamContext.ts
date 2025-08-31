import { createContext, useContext } from 'react';
import { Team } from '@/types/teams';

interface TeamContextType {
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  userTeams: Team[];
  canManageTeam: (teamId: string) => boolean;
  isTeamMember: (teamId: string) => boolean;
}

export const TeamContext = createContext<TeamContextType | null>(null);

export const useTeamContext = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
};