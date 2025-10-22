import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TimeOffRequest } from '@/types/employee';

export const useTimeOffRequests = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  const { data: requests, isLoading } = useQuery({
    queryKey: ['time-off-requests', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TimeOffRequest[];
    },
    enabled: !!targetUserId,
  });

  const createRequest = useMutation({
    mutationFn: async (request: Omit<TimeOffRequest, 'id' | 'created_at' | 'approved_by' | 'approved_at'>) => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Time off request submitted');
    },
    onError: (error) => {
      console.error('Error creating request:', error);
      toast.error('Failed to submit time off request');
    },
  });

  const approveRequest = useMutation({
    mutationFn: async ({ requestId, approverId }: { requestId: string; approverId: string }) => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Time off request approved');
    },
  });

  const denyRequest = useMutation({
    mutationFn: async ({ requestId, approverId }: { requestId: string; approverId: string }) => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update({
          status: 'denied',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Time off request denied');
    },
  });

  return {
    requests: requests || [],
    isLoading,
    createRequest: createRequest.mutate,
    approveRequest: approveRequest.mutate,
    denyRequest: denyRequest.mutate,
  };
};
