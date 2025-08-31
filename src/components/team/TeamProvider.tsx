import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team } from '@/types/teams';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { TeamContext } from '@/hooks/useTeamContext';

interface TeamProviderProps {
  children: React.ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { teams, isLoading } = useTeamsByOrganization(user?.organizationId);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const userTeams = teams as Team[];

  const canManageTeam = (teamId: string) => {
    if (!user) return false;
    if (user.role === 'superadmin' || user.role === 'admin') return true;
    
    const team = teams.find(t => t.id === teamId);
    return team?.manager_id === user.id;
  };

  const isTeamMember = (teamId: string) => {
    // TODO: Implement proper team membership check
    return userTeams.some(team => team.id === teamId);
  };

  // Auto-select first team if none selected and user has teams
  useEffect(() => {
    if (!selectedTeam && userTeams.length > 0) {
      setSelectedTeam(userTeams[0]);
    }
  }, [selectedTeam, userTeams]);

  // Don't render children until we have the necessary data
  if (!user || isLoading) {
    return <div>Loading team data...</div>;
  }

  return (
    <TeamContext.Provider value={{
      selectedTeam,
      setSelectedTeam,
      userTeams,
      canManageTeam,
      isTeamMember,
    }}>
      {children}
    </TeamContext.Provider>
  );
};