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
          user_id
        `)
        .eq('organization_id', user.organizationId)
        .gte('clock_in', weekStart.toISOString())
        .lte('clock_in', weekEnd.toISOString())
        .not('clock_out', 'is', null);

      if (timeError) throw timeError;

      // Fetch teams data with actual member data
      let teamsQuery = supabase
        .from('teams')
        .select(`
          *,
          team_memberships!inner(
            user_id,
            users!inner(id, name)
          )
        `)
        .eq('organization_id', user.organizationId)
        .eq('is_active', true);

      if (selectedTeamId && selectedTeamId !== 'all') {
        teamsQuery = teamsQuery.eq('id', selectedTeamId);
      }

      const { data: teams, error: teamsError } = await teamsQuery;

      if (teamsError) throw teamsError;

      // Create a map of team members for efficient lookup
      const teamMembersMap = new Map<string, Set<string>>();
      teams?.forEach(team => {
        const memberIds = new Set<string>();
        if (Array.isArray(team.team_memberships)) {
          team.team_memberships.forEach((membership: any) => {
            if (membership.user_id) {
              memberIds.add(membership.user_id);
            }
          });
        }
        teamMembersMap.set(team.id, memberIds);
      });

      console.log('Teams data:', teams);
      console.log('Team members map:', teamMembersMap);
      console.log('Time entries:', timeEntries);

      // Process data to create team stats
      const statsMap = new Map<string, TeamTimeStats>();

      // Initialize stats for each team
      teams?.forEach(team => {
        const memberIds = teamMembersMap.get(team.id) || new Set();
        statsMap.set(team.id, {
          teamId: team.id,
          teamName: team.name,
          memberCount: memberIds.size,
          totalHours: 0,
          scheduledHours: 0,
          activeMembers: 0,
          overtimeHours: 0,
          complianceIssues: 0,
          weeklyTarget: memberIds.size * 40, // Assume 40 hour target per member
        });
      });

      // Process time entries to calculate real stats
      const teamActiveMembers = new Map<string, Set<string>>();
      const teamCompletedShifts = new Map<string, number>();
      
      timeEntries?.forEach(entry => {
        if (entry.duration_minutes && entry.user_id) {
          const hours = entry.duration_minutes / 60;
          const userId = entry.user_id;
          
          // Find which team this user belongs to
          for (const [teamId, memberIds] of teamMembersMap.entries()) {
            if (memberIds.has(userId)) {
              const teamStats = statsMap.get(teamId);
              if (teamStats) {
                teamStats.totalHours += hours;
                
                // Track active members
                if (!teamActiveMembers.has(teamId)) {
                  teamActiveMembers.set(teamId, new Set());
                }
                teamActiveMembers.get(teamId)!.add(userId);
                
                // Count completed shifts (each time entry is a shift)
                const currentShifts = teamCompletedShifts.get(teamId) || 0;
                teamCompletedShifts.set(teamId, currentShifts + 1);
                
                // Calculate overtime (hours > 8 per day)
                if (hours > 8) {
                  teamStats.overtimeHours += (hours - 8);
                }
              }
              break; // User found in this team, no need to check others
            }
          }
        }
      });

      console.log('Team completed shifts:', teamCompletedShifts);

      // Set active members count and completed shifts
      statsMap.forEach((stats, teamId) => {
        const activeSet = teamActiveMembers.get(teamId);
        stats.activeMembers = activeSet ? activeSet.size : 0;
        
        // Set scheduled hours to completed shifts count for display
        const completedShifts = teamCompletedShifts.get(teamId) || 0;
        stats.scheduledHours = completedShifts;
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