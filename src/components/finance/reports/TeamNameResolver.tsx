import React from 'react';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';

interface TeamNameResolverProps {
  teamId: string | null;
  fallback?: string;
}

export const TeamNameResolver: React.FC<TeamNameResolverProps> = ({ 
  teamId, 
  fallback = 'All Teams' 
}) => {
  const { teams } = useTeamQueries();

  if (!teamId) return <>{fallback}</>;

  const team = teams.find(t => t.id === teamId);
  return <>{team?.name || `Team ${teamId}`}</>;
};