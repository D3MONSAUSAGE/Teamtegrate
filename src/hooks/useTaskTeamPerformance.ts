import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface TaskTeamPerformance {
  team_id: string;
  team_name: string;
  member_count: number;
  total_tasks: number;
  completed_tasks: number;
  avg_completion_rate: number;
  team_velocity: number;
  workload_balance_score: number;
  collaboration_score: number;
  team_score: number;
  top_performer_id: string;
  top_performer_name: string;
}

interface UseTaskTeamPerformanceParams {
  teamIds?: string[];
  startDate: Date;
  endDate: Date;
  timezone?: string;
  organizationId: string;
}

export const useTaskTeamPerformance = ({
  teamIds,
  startDate,
  endDate,
  timezone = 'UTC',
  organizationId
}: UseTaskTeamPerformanceParams) => {
  return useQuery({
    queryKey: ['task-team-performance', teamIds, startDate, endDate, timezone, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_team_task_performance', {
        p_org: organizationId,
        p_team: teamIds || null,
        p_start: format(startDate, 'yyyy-MM-dd'),
        p_end: format(endDate, 'yyyy-MM-dd'),
        p_tz: timezone
      });

      if (error) throw error;
      return data as TaskTeamPerformance[];
    },
    enabled: !!organizationId
  });
};
