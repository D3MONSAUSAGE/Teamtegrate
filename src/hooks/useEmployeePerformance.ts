import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface EmployeePerformance {
  user_id: string;
  user_name: string;
  user_email: string;
  total_tasks: number;
  completed_tasks: number;
  completed_on_time: number;
  overdue_tasks: number;
  completion_rate: number;
  velocity: number;
  quality_score: number;
  consistency_score: number;
  total_score: number;
}

interface UseEmployeePerformanceParams {
  userId?: string;
  startDate: Date;
  endDate: Date;
  timezone?: string;
  organizationId: string;
}

export const useEmployeePerformance = ({
  userId,
  startDate,
  endDate,
  timezone = 'UTC',
  organizationId
}: UseEmployeePerformanceParams) => {
  return useQuery({
    queryKey: ['employee-performance', userId, startDate, endDate, timezone, organizationId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('rpc_employee_task_performance', {
        p_org: organizationId,
        p_user: userId,
        p_start: format(startDate, 'yyyy-MM-dd'),
        p_end: format(endDate, 'yyyy-MM-dd'),
        p_tz: timezone
      });

      if (error) throw error;
      return data?.[0] as EmployeePerformance | null;
    },
    enabled: !!userId && !!organizationId
  });
};
