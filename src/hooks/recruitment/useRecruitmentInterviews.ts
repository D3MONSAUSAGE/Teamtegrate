import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecruitmentInterview } from '@/types/recruitment';

export const useRecruitmentInterviews = (candidateId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['recruitment-interviews', user?.organizationId, candidateId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      let query = supabase
        .from('recruitment_interviews')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('scheduled_date', { ascending: true });

      if (candidateId) {
        query = query.eq('candidate_id', candidateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RecruitmentInterview[];
    },
    enabled: !!user?.organizationId,
  });

  const scheduleInterview = useMutation({
    mutationFn: async (interviewData: Omit<RecruitmentInterview, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { data, error } = await supabase
        .from('recruitment_interviews')
        .insert({
          ...interviewData,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-interviews'] });
      toast.success('Interview scheduled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to schedule interview');
    },
  });

  const updateInterview = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecruitmentInterview> & { id: string }) => {
      const { error } = await supabase
        .from('recruitment_interviews')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', user!.organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-interviews'] });
      toast.success('Interview updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update interview');
    },
  });

  return {
    interviews,
    isLoading,
    scheduleInterview: scheduleInterview.mutate,
    updateInterview: updateInterview.mutate,
    isScheduling: scheduleInterview.isPending,
    isUpdating: updateInterview.isPending,
  };
};
