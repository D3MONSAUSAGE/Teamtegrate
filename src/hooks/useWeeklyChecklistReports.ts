import { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfWeek, endOfWeek, format, parseISO, isSameWeek, eachDayOfInterval } from 'date-fns';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DailyScore {
  date: string;
  totalChecklists: number;
  completedChecklists: number;
  verifiedChecklists: number;
  executionPercentage: number;
  verificationPercentage: number;
}

interface WeeklyChecklistData {
  weekStart: Date;
  weekEnd: Date;
  teamName: string;
  dailyScores: DailyScore[];
  totals: {
    totalChecklists: number;
    completedChecklists: number;
    verifiedChecklists: number;
    averageExecutionPercentage: number;
    averageVerificationPercentage: number;
  };
}

interface UseWeeklyChecklistReportsReturn {
  weeklyData: WeeklyChecklistData | null;
  selectedWeek: Date;
  setSelectedWeek: (week: Date) => void;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  teams: Array<{id: string; name: string}>;
  weeksWithData: Date[];
  totalChecklists: number;
  isLoading: boolean;
  error: string | null;
}

export const useWeeklyChecklistReports = (): UseWeeklyChecklistReportsReturn => {
  const { user } = useAuth();
  const { teams: teamsData } = useTeamQueries();
  
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => new Date());
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [checklistExecutions, setChecklistExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived data
  const teams = useMemo(() => {
    const allOption = { id: 'all', name: 'All Teams' };
    return [allOption, ...(teamsData || [])];
  }, [teamsData]);

  // Fetch checklist execution data
  const fetchChecklistData = useCallback(async () => {
    if (!user?.organizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get checklist executions with checklist details
      let query = supabase
        .from('checklist_executions')
        .select(`
          *,
          checklists (
            title,
            team_id,
            teams (
              name
            )
          ),
          checklist_execution_items (
            id,
            status,
            is_verified
          )
        `)
        .eq('organization_id', user.organizationId)
        .order('execution_date', { ascending: false });

      // Apply team filter
      if (selectedTeam !== 'all') {
        query = query.eq('checklists.team_id', selectedTeam);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setChecklistExecutions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch checklist data';
      setError(errorMessage);
      console.error('[useWeeklyChecklistReports] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.organizationId, selectedTeam]);

  // Calculate weeks with data
  const weeksWithData = useMemo(() => {
    const weeks = new Map<string, Date>();
    checklistExecutions.forEach(execution => {
      const weekStart = startOfWeek(parseISO(execution.execution_date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, weekStart);
      }
    });
    return Array.from(weeks.values()).sort((a, b) => b.getTime() - a.getTime());
  }, [checklistExecutions]);

  // Calculate weekly data
  const weeklyData = useMemo((): WeeklyChecklistData | null => {
    if (checklistExecutions.length === 0) return null;
    
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    
    // Filter executions for selected week
    const weekExecutions = checklistExecutions.filter(execution => 
      isSameWeek(parseISO(execution.execution_date), selectedWeek, { weekStartsOn: 1 })
    );
    
    if (weekExecutions.length === 0) {
      const selectedTeamName = selectedTeam === 'all' ? 'All Teams' : 
        teams.find(t => t.id === selectedTeam)?.name || selectedTeam;
      return {
        weekStart,
        weekEnd,
        teamName: selectedTeamName,
        dailyScores: [],
        totals: {
          totalChecklists: 0,
          completedChecklists: 0,
          verifiedChecklists: 0,
          averageExecutionPercentage: 0,
          averageVerificationPercentage: 0
        }
      };
    }

    // Generate daily scores for each day of the week
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const dailyScores: DailyScore[] = daysOfWeek.map(day => {
      const dayExecutions = weekExecutions.filter(execution => 
        format(parseISO(execution.execution_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );

      const totalChecklists = dayExecutions.length;
      const completedChecklists = dayExecutions.filter(execution => 
        execution.status === 'completed'
      ).length;
      
      // Calculate verified checklists (all items verified)
      const verifiedChecklists = dayExecutions.filter(execution => {
        if (execution.status !== 'completed') return false;
        const items = execution.checklist_execution_items || [];
        return items.length > 0 && items.every((item: any) => item.is_verified);
      }).length;

      const executionPercentage = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;
      const verificationPercentage = completedChecklists > 0 ? Math.round((verifiedChecklists / completedChecklists) * 100) : 0;

      return {
        date: format(day, 'yyyy-MM-dd'),
        totalChecklists,
        completedChecklists,
        verifiedChecklists,
        executionPercentage,
        verificationPercentage
      };
    });

    // Calculate totals
    const totals = dailyScores.reduce(
      (acc, day) => ({
        totalChecklists: acc.totalChecklists + day.totalChecklists,
        completedChecklists: acc.completedChecklists + day.completedChecklists,
        verifiedChecklists: acc.verifiedChecklists + day.verifiedChecklists,
        averageExecutionPercentage: acc.averageExecutionPercentage + day.executionPercentage,
        averageVerificationPercentage: acc.averageVerificationPercentage + day.verificationPercentage
      }),
      {
        totalChecklists: 0,
        completedChecklists: 0,
        verifiedChecklists: 0,
        averageExecutionPercentage: 0,
        averageVerificationPercentage: 0
      }
    );

    // Calculate averages
    const daysWithData = dailyScores.filter(day => day.totalChecklists > 0).length;
    totals.averageExecutionPercentage = daysWithData > 0 ? Math.round(totals.averageExecutionPercentage / daysWithData) : 0;
    totals.averageVerificationPercentage = daysWithData > 0 ? Math.round(totals.averageVerificationPercentage / daysWithData) : 0;

    const selectedTeamName = selectedTeam === 'all' ? 'All Teams' : 
      teams.find(t => t.id === selectedTeam)?.name || selectedTeam;

    return {
      weekStart,
      weekEnd,
      teamName: selectedTeamName,
      dailyScores,
      totals
    };
  }, [checklistExecutions, selectedWeek, selectedTeam, teams]);

  // Initialize data on mount
  useEffect(() => {
    fetchChecklistData();
  }, [fetchChecklistData]);

  return {
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    selectedTeam,
    setSelectedTeam,
    teams,
    weeksWithData,
    totalChecklists: checklistExecutions.length,
    isLoading,
    error
  };
};