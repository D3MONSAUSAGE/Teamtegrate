import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { RecruitmentCandidate, CandidateWithDetails, CandidateStatus } from '@/types/recruitment';

export const useRecruitmentCandidates = (filters?: { positionId?: string; stageId?: string; status?: CandidateStatus | null }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading, error } = useQuery({
    queryKey: ['recruitment-candidates', user?.organizationId, filters],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      let query = supabase
        .from('recruitment_candidates')
        .select(`
          *,
          position:recruitment_positions(id, job_title, department),
          current_stage:recruitment_pipeline_stages(id, stage_name, color_code, stage_order)
        `)
        .eq('organization_id', user.organizationId)
        .order('applied_date', { ascending: false });

      if (filters?.positionId) {
        query = query.eq('position_id', filters.positionId);
      }
      if (filters?.stageId) {
        query = query.eq('current_stage_id', filters.stageId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      return data as CandidateWithDetails[];
    },
    enabled: !!user?.organizationId,
  });

  const moveCandidateToStage = useMutation({
    mutationFn: async ({ candidateId, newStageId, reason }: { candidateId: string; newStageId: string; reason?: string }) => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { error } = await supabase
        .from('recruitment_candidates')
        .update({ current_stage_id: newStageId, updated_at: new Date().toISOString() })
        .eq('id', candidateId)
        .eq('organization_id', user.organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
      toast.success('Candidate moved to new stage');
    },
    onError: (error) => {
      console.error('Error moving candidate:', error);
      toast.error('Failed to move candidate');
    },
  });

  const updateCandidateStatus = useMutation({
    mutationFn: async ({ candidateId, status }: { candidateId: string; status: CandidateStatus }) => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { error } = await supabase
        .from('recruitment_candidates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', candidateId)
        .eq('organization_id', user.organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
      toast.success('Candidate status updated');
    },
    onError: (error) => {
      console.error('Error updating candidate status:', error);
      toast.error('Failed to update candidate status');
    },
  });

  // Subscribe to realtime updates for recruitment candidates
  useEffect(() => {
    if (!user?.organizationId) return;

    const channel = supabase
      .channel('recruitment-candidates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recruitment_candidates',
          filter: `organization_id=eq.${user.organizationId}`
        },
        () => {
          // Refetch candidates when any change occurs
          queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.organizationId, queryClient]);

  return {
    candidates,
    isLoading,
    error: error ? (error as Error).message : null,
    moveCandidateToStage: moveCandidateToStage.mutate,
    updateCandidateStatus: updateCandidateStatus.mutate,
    isMoving: moveCandidateToStage.isPending,
  };
};
