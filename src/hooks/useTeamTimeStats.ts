import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface TeamTimeStats {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalHours: number;
  scheduledHours: number;
  activeMembers: number;
  overtimeHours: number;
  complianceIssues: number;
  weeklyTarget: number;
}

export const useTeamTimeStats = (weekDate: Date, selectedTeamId?: string | null) => {
  const { user } = useAuth();
  const [teamStats, setTeamStats] = useState<TeamTimeStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamStats = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

      // Fetch time entries for the week
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select(`
          *,
          users!inner(id, name)
        `)
        .eq('organization_id', user.organizationId)
        .gte('clock_in', weekStart.toISOString())
        .lte('clock_in', weekEnd.toISOString())
        .not('clock_out', 'is', null);

      if (timeError) throw timeError;

      // Fetch teams data with member count
      let teamsQuery = supabase
        .from('teams')
        .select(`
          *,
          team_memberships(count)
        `)
        .eq('organization_id', user.organizationId)
        .eq('is_active', true);

      if (selectedTeamId && selectedTeamId !== 'all') {
        teamsQuery = teamsQuery.eq('id', selectedTeamId);
      }

      const { data: teams, error: teamsError } = await teamsQuery;

      if (teamsError) throw teamsError;

      // Process data to create team stats
      const statsMap = new Map<string, TeamTimeStats>();

      // Initialize stats for each team
      teams?.forEach(team => {
        const memberCount = Array.isArray(team.team_memberships) ? team.team_memberships.length : 0;
        statsMap.set(team.id, {
          teamId: team.id,
          teamName: team.name,
          memberCount,
          totalHours: 0,
          scheduledHours: 0,
          activeMembers: 0,
          overtimeHours: 0,
          complianceIssues: 0,
          weeklyTarget: memberCount * 40, // Assume 40 hour target per member
        });
      });

      // For now, we'll create mock data since we need team membership information
      // In a real implementation, this would require proper team membership tracking
      timeEntries?.forEach(entry => {
        if (entry.duration_minutes) {
          const hours = entry.duration_minutes / 60;
          
          // For demo purposes, assign to first team or create a default team stat
          if (statsMap.size > 0) {
            const firstTeam = Array.from(statsMap.values())[0];
            firstTeam.totalHours += hours;
            
            if (hours > 8) {
              firstTeam.overtimeHours += (hours - 8);
            }
          }
        }
      });

      // Set some mock active members for demo
      statsMap.forEach(stats => {
        stats.activeMembers = Math.min(stats.memberCount, Math.max(1, Math.floor(stats.totalHours / 8)));
      });


      // Check for compliance issues (simplified - could be more sophisticated)
      statsMap.forEach(stats => {
        // Flag teams with high overtime
        if (stats.overtimeHours > stats.memberCount * 5) {
          stats.complianceIssues += 1;
        }
        
        // Flag teams with very low activity
        if (stats.activeMembers < stats.memberCount * 0.5 && stats.memberCount > 0) {
          stats.complianceIssues += 1;
        }
      });

      setTeamStats(Array.from(statsMap.values()));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team stats';
      setError(errorMessage);
      console.error('Fetch team stats error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamStats();
  }, [user?.organizationId, weekDate, selectedTeamId]);

  return {
    teamStats,
    isLoading,
    error,
    refetch: fetchTeamStats
  };
};