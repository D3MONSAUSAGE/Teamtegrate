import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecruitmentReference } from '@/types/recruitment';

export const useRecruitmentReferences = (candidateId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: references = [], isLoading } = useQuery({
    queryKey: ['recruitment-references', candidateId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('recruitment_references')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecruitmentReference[];
    },
    enabled: !!user?.organizationId && !!candidateId,
  });

  const addReference = useMutation({
    mutationFn: async (referenceData: Omit<RecruitmentReference, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { data, error } = await supabase
        .from('recruitment_references')
        .insert({
          ...referenceData,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-references', candidateId] });
      toast.success('Reference added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add reference');
    },
  });

  const updateReference = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecruitmentReference> & { id: string }) => {
      const { error } = await supabase
        .from('recruitment_references')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', user!.organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-references', candidateId] });
      toast.success('Reference updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update reference');
    },
  });

  return {
    references,
    isLoading,
    addReference: addReference.mutate,
    updateReference: updateReference.mutate,
    isAdding: addReference.isPending,
    isUpdating: updateReference.isPending,
  };
};
