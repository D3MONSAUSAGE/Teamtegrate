import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { RecruitmentPipelineStage } from '@/types/recruitment';

export const useRecruitmentPipeline = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['recruitment-pipeline-stages', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('recruitment_pipeline_stages')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('stage_order');

      if (error) throw error;
      return data as RecruitmentPipelineStage[];
    },
    enabled: !!user?.organizationId,
  });

  // Initialize default stages if none exist
  const initializeDefaultStages = useMutation({
    mutationFn: async () => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const defaultStages: Omit<RecruitmentPipelineStage, 'id' | 'created_at' | 'updated_at'>[] = [
        { organization_id: user.organizationId, stage_name: 'Applied', stage_order: 1, stage_type: 'applied', color_code: '#6B7280', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Resume Review', stage_order: 2, stage_type: 'screening', color_code: '#3B82F6', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Phone Screen', stage_order: 3, stage_type: 'screening', color_code: '#8B5CF6', is_active: true },
        { organization_id: user.organizationId, stage_name: 'First Interview', stage_order: 4, stage_type: 'interview', color_code: '#EC4899', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Skills Assessment', stage_order: 5, stage_type: 'assessment', color_code: '#F59E0B', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Second Interview', stage_order: 6, stage_type: 'interview', color_code: '#10B981', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Manager Approval', stage_order: 7, stage_type: 'approval', color_code: '#EF4444', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Reference Check', stage_order: 8, stage_type: 'assessment', color_code: '#06B6D4', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Offer Extended', stage_order: 9, stage_type: 'offer', color_code: '#8B5CF6', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Offer Accepted', stage_order: 10, stage_type: 'offer', color_code: '#22C55E', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Ready for Onboarding', stage_order: 11, stage_type: 'hired', color_code: '#14B8A6', is_active: true },
        { organization_id: user.organizationId, stage_name: 'Rejected', stage_order: 12, stage_type: 'rejected', color_code: '#DC2626', is_active: true },
      ];

      const { error } = await supabase
        .from('recruitment_pipeline_stages')
        .insert(defaultStages);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-pipeline-stages'] });
      toast.success('Pipeline stages initialized successfully');
    },
    onError: (error) => {
      console.error('Error initializing stages:', error);
      toast.error('Failed to initialize pipeline stages');
    },
  });

  return {
    stages,
    isLoading,
    initializeDefaultStages: initializeDefaultStages.mutate,
    isInitializing: initializeDefaultStages.isPending,
  };
};
