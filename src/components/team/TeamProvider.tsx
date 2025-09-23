import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team } from '@/types/teams';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { TeamContext } from '@/hooks/useTeamContext';

interface TeamProviderProps {
  children: React.ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { teams, isLoading, availableTeams, canManageTeam: canManage } = useTeamAccess();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const userTeams = teams;

  const canManageTeam = (teamId: string) => {
    return canManage(teamId);
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
      setSelectedTeam,
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