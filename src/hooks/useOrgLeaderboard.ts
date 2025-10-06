import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  team_name: string;
  total_score: number;
  completed_tasks: number;
  completion_rate: number;
  badges: string[];
}

interface UseOrgLeaderboardParams {
  startDate: Date;
  endDate: Date;
  timezone?: string;
  organizationId: string;
  limit?: number;
}

export const useOrgLeaderboard = ({
  startDate,
  endDate,
  timezone = 'UTC',
  organizationId,
  limit = 10
}: UseOrgLeaderboardParams) => {
  return useQuery({
    queryKey: ['org-leaderboard', startDate, endDate, timezone, organizationId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_org_task_leaderboard', {
        p_org: organizationId,
        p_start: format(startDate, 'yyyy-MM-dd'),
        p_end: format(endDate, 'yyyy-MM-dd'),
        p_tz: timezone,
        p_limit: limit
      });

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    enabled: !!organizationId
  });
};
