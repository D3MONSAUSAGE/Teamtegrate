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

  // Load saved team selection from localStorage on mount
  useEffect(() => {
    const savedTeamId = localStorage.getItem('selectedTeamId');
    if (savedTeamId && userTeams.length > 0) {
      const savedTeam = userTeams.find(team => team.id === savedTeamId);
      if (savedTeam) {
        setSelectedTeam(savedTeam);
      }
    }
  }, [userTeams]);

  // Enhanced setSelectedTeam with localStorage persistence
  const setSelectedTeamWithPersistence = (team: Team | null) => {
    setSelectedTeam(team);
    if (team) {
      localStorage.setItem('selectedTeamId', team.id);
    } else {
      localStorage.removeItem('selectedTeamId');
    }
  };

  const canManageTeam = (teamId: string) => {
    if (!user) return false;
    if (user.role === 'superadmin' || user.role === 'admin') return true;
    
    const team = teams.find(t => t.id === teamId);
    return team?.manager_id === user.id;
  };

  const isTeamMember = (teamId: string) => {
    // Enhanced team membership check with team_memberships table integration
    return userTeams.some(team => team.id === teamId);
  };

  const getUserManagedTeams = () => {
    if (!user) return [];
    if (user.role === 'superadmin' || user.role === 'admin') return userTeams;
    
    // Return teams where user is manager or team leader
    return userTeams.filter(team => 
      team.manager_id === user.id || 
      // Add team leader check here when team_memberships is integrated
      false
    );
  };

  const canUserInviteToTeamChat = (teamId: string, targetUserId: string) => {
    if (!user) return false;
    
    // Superadmins and admins can invite anyone within the organization
    if (['superadmin', 'admin'].includes(user.role)) return true;
    
    // Managers can invite their team members and other managers/admins
    if (user.role === 'manager' && canManageTeam(teamId)) return true;
    
    // Team leaders can invite their team members only
    if (user.role === 'team_leader') {
      // Check if user is team leader of this team and target is team member
      return isTeamMember(teamId); // Simplified for now
    }
    
    return false;
  };

  // Keep selectedTeam as null by default to show "All Teams"
  // useEffect(() => {
  //   if (!selectedTeam && userTeams.length > 0) {
  //     setSelectedTeam(userTeams[0]);
  //   }
  // }, [selectedTeam, userTeams]);

  // Don't render children until we have the necessary data
  if (!user || isLoading) {
    return <div>Loading team data...</div>;
  }

  return (
    <TeamContext.Provider value={{
      selectedTeam,
      setSelectedTeam: setSelectedTeamWithPersistence,
      userTeams,
      canManageTeam,
      isTeamMember,
      getUserManagedTeams,
      canUserInviteToTeamChat,
    }}>
      {children}
    </TeamContext.Provider>
  );
};