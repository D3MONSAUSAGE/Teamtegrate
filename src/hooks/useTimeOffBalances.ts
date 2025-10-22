import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TimeOffBalance } from '@/types/employee';

export const useTimeOffBalances = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  const { data: balances, isLoading } = useQuery({
    queryKey: ['time-off-balances', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('employee_time_off_balances')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('year', new Date().getFullYear())
        .order('leave_type');

      if (error) throw error;
      return data as TimeOffBalance[];
    },
    enabled: !!targetUserId,
  });

  const createBalance = useMutation({
    mutationFn: async (balance: Omit<TimeOffBalance, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('employee_time_off_balances')
        .insert(balance)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-balances', targetUserId] });
      toast.success('Time off balance created');
    },
    onError: (error) => {
      console.error('Error creating balance:', error);
      toast.error('Failed to create time off balance');
    },
  });

  const updateBalance = useMutation({
    mutationFn: async ({ balanceId, updates }: { balanceId: string; updates: Partial<TimeOffBalance> }) => {
      const { data, error } = await supabase
        .from('employee_time_off_balances')
        .update(updates)
        .eq('id', balanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-balances', targetUserId] });
      toast.success('Time off balance updated');
    },
    onError: (error) => {
      console.error('Error updating balance:', error);
      toast.error('Failed to update time off balance');
    },
  });

  const getAvailableHours = (leaveType: string) => {
    const balance = balances?.find(b => b.leave_type === leaveType);
    if (!balance) return 0;
    return Math.max(0, balance.total_hours - balance.used_hours);
  };

  return {
    balances: balances || [],
    isLoading,
    createBalance: createBalance.mutate,
    updateBalance: updateBalance.mutate,
    getAvailableHours,
  };
};
