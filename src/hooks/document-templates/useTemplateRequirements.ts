import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TemplateDocumentRequirement, CreateRequirementRequest } from '@/types/document-templates';

export const useTemplateRequirements = (templateId?: string) => {
  const queryClient = useQueryClient();

  const { data: requirements, isLoading } = useQuery({
    queryKey: ['template-requirements', templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from('template_document_requirements' as any)
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as unknown as TemplateDocumentRequirement[];
    },
    enabled: !!templateId,
  });

  const createRequirement = useMutation({
    mutationFn: async (requirement: CreateRequirementRequest) => {
      const { data, error } = await supabase
        .from('template_document_requirements' as any)
        .insert(requirement as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Requirement added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add requirement: ${error.message}`);
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TemplateDocumentRequirement> }) => {
      const { data, error } = await supabase
        .from('template_document_requirements' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Requirement updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update requirement: ${error.message}`);
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('template_document_requirements' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Requirement deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete requirement: ${error.message}`);
    },
  });

  const reorderRequirements = useMutation({
    mutationFn: async (requirements: Array<{ id: string; display_order: number }>) => {
      const promises = requirements.map(({ id, display_order }) =>
        supabase
          .from('template_document_requirements' as any)
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-requirements'] });
      toast.success('Requirements reordered successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder requirements: ${error.message}`);
    },
  });

  return {
    requirements: requirements || [],
    isLoading,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    reorderRequirements,
  };
};
