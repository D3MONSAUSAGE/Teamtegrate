import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RecruitmentStageTransition } from '@/types/recruitment';

export const useRecruitmentStageTransitions = (candidateId: string) => {
  const { user } = useAuth();

  const { data: transitions = [], isLoading } = useQuery({
    queryKey: ['recruitment-stage-transitions', candidateId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('recruitment_stage_transitions')
        .select(`
          *,
          from_stage:recruitment_pipeline_stages!from_stage_id(stage_name, color_code),
          to_stage:recruitment_pipeline_stages!to_stage_id(stage_name, color_code)
        `)
        .eq('candidate_id', candidateId)
        .eq('organization_id', user.organizationId)
        .order('transition_date', { ascending: false });

      if (error) throw error;
      return data as (RecruitmentStageTransition & {
        from_stage?: { stage_name: string; color_code: string };
        to_stage: { stage_name: string; color_code: string };
      })[];
    },
    enabled: !!user?.organizationId && !!candidateId,
  });

  return {
    transitions,
    isLoading,
  };
};
