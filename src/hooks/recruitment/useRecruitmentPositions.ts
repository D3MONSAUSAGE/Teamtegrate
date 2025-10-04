import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { RecruitmentPosition } from '@/types/recruitment';

export const useRecruitmentPositions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: positions = [], isLoading, error } = useQuery({
    queryKey: ['recruitment-positions', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error: fetchError } = await supabase
        .from('recruitment_positions')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('posted_date', { ascending: false });

      if (fetchError) throw fetchError;
      return data as RecruitmentPosition[];
    },
    enabled: !!user?.organizationId,
  });

  const createPosition = useMutation({
    mutationFn: async (positionData: Omit<RecruitmentPosition, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { data, error } = await supabase
        .from('recruitment_positions')
        .insert({
          ...positionData,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions'] });
      toast.success('Position created successfully');
    },
    onError: (error) => {
      console.error('Error creating position:', error);
      toast.error('Failed to create position');
    },
  });

  const updatePosition = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecruitmentPosition> & { id: string }) => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { error } = await supabase
        .from('recruitment_positions')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', user.organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions'] });
      toast.success('Position updated successfully');
    },
    onError: (error) => {
      console.error('Error updating position:', error);
      toast.error('Failed to update position');
    },
  });

  return {
    positions,
    isLoading,
    error: error ? (error as Error).message : null,
    createPosition: createPosition.mutate,
    updatePosition: updatePosition.mutate,
    isCreating: createPosition.isPending,
    isUpdating: updatePosition.isPending,
  };
};
