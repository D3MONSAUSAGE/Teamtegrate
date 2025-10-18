import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EmployeeDocumentTemplate, CreateTemplateRequest } from '@/types/document-templates';

export const useDocumentTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['document-templates', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization ID');

      const { data, error } = await supabase
        .from('employee_document_templates' as any)
        .select(`
          *,
          requirements:template_document_requirements(*)
        `)
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as EmployeeDocumentTemplate[];
    },
    enabled: !!user?.organizationId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: CreateTemplateRequest) => {
      if (!user?.organizationId || !user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('employee_document_templates' as any)
        .insert({
          ...template,
          organization_id: user.organizationId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmployeeDocumentTemplate> }) => {
      const { data, error } = await supabase
        .from('employee_document_templates' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_document_templates' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  return {
    templates: templates || [],
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
