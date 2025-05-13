
import { useState, useEffect } from 'react';
import { TeamMemberPerformance } from '@/types';
import { fetchTeamPerformance, fetchTeamMemberPerformance } from '@/contexts/task/api';
import { useAuth } from '@/contexts/AuthContext';

export const useTeamPerformance = () => {
  const [teamPerformance, setTeamPerformance] = useState<TeamMemberPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  const refreshTeamPerformance = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTeamPerformance();
      setTeamPerformance(data);
    } catch (err) {
      console.error('Error refreshing team performance:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch team performance'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const getTeamMemberPerformance = async (userId: string): Promise<TeamMemberPerformance | null> => {
    if (!user || !userId) return null;
    
    try {
      return await fetchTeamMemberPerformance(userId);
    } catch (err) {
      console.error('Error getting team member performance:', err);
      return null;
    }
  };
  
  useEffect(() => {
    refreshTeamPerformance();
  }, [user]);
  
  return {
    teamPerformance,
    isLoading,
    error,
    refreshTeamPerformance,
    getTeamMemberPerformance
  };
};
