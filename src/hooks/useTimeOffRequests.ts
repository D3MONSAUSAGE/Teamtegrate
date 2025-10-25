import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TimeOffRequest } from '@/types/employee';

interface UseTimeOffRequestsOptions {
  userId?: string;
  scope?: 'my-requests' | 'all-requests';
}

export const useTimeOffRequests = (options?: UseTimeOffRequestsOptions | string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Support both old API (string userId) and new API (options object)
  const opts = typeof options === 'string' ? { userId: options } : (options || {});
  const { userId, scope = 'my-requests' } = opts;
  
  const targetUserId = userId || user?.id;
  const isManager = user?.role && ['manager', 'admin', 'superadmin', 'team_leader'].includes(user.role);
  const shouldFetchAll = scope === 'all-requests' && isManager;

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['time-off-requests', shouldFetchAll ? 'all' : targetUserId, scope],
    queryFn: async () => {
      if (!user?.organizationId && !targetUserId) return [];
      
      let query = supabase
        .from('time_off_requests')
        .select(`
          *,
          user:users!time_off_requests_user_id_fkey(
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // If fetching all requests for managers, filter by organization
      // Otherwise, filter by specific user
      if (shouldFetchAll) {
        query = query.eq('organization_id', user.organizationId);
      } else if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (TimeOffRequest & { user?: { id: string; name: string; email: string } })[];
    },
    enabled: !!(shouldFetchAll ? user?.organizationId : targetUserId),
    staleTime: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
      queryClient.invalidateQueries({ 
        queryKey: ['time-off-requests'],
        refetchType: 'active'
      });
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
    refetch,
    createRequest: createRequest.mutate,
    approveRequest: approveRequest.mutate,
    denyRequest: denyRequest.mutate,
  };
};
