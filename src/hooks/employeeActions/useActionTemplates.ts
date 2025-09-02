import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { ActionTemplate, CreateTemplateData } from '@/types/employeeActions';

export const useActionTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['action-templates', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('action_templates')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('template_name');
      
      if (error) throw error;
      
      // Fetch creator details separately
      const creatorIds = [...new Set(data.map(t => t.created_by))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', creatorIds);
      
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      return (data || []).map(template => ({
        ...template,
        creator_name: usersMap[template.created_by]?.name,
      })) as ActionTemplate[];
    },
    enabled: !!user?.organizationId,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      if (!user?.organizationId) throw new Error('No organization ID');
      
      const { data: result, error } = await supabase
        .from('action_templates')
        .insert([{
          ...data,
          organization_id: user.organizationId,
          created_by: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) => {
      const { data: result, error } = await supabase
        .from('action_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('action_templates')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    },
  });

  // Increment usage count
  const incrementUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: template, error: fetchError } = await supabase
        .from('action_templates')
        .select('usage_count')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('action_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-templates'] });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    incrementUsage: incrementUsageMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  };
};