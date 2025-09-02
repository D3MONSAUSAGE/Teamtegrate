import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { OnboardingTemplate, CreateOnboardingTemplateRequest } from '@/types/onboarding';
import { toast } from 'sonner';

export const useOnboardingTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['onboarding-templates', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) {
        console.log('useOnboardingTemplates: No organization ID');
        throw new Error('No organization');
      }

      console.log('Fetching templates for organization:', user.organizationId);

      // First, try a simple query without joins to see if basic templates work
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }

      console.log('Templates fetched successfully:', data);
      
      // Filter out any templates with invalid IDs
      const validTemplates = data?.filter(template => 
        template.id && 
        typeof template.id === 'string' && 
        template.name && 
        template.name.trim() !== ''
      ) || [];
      
      console.log('Valid templates:', validTemplates);
      return validTemplates as OnboardingTemplate[];
    },
    enabled: !!user?.organizationId,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateOnboardingTemplateRequest) => {
      if (!user?.organizationId || !user?.id) throw new Error('No user or organization');

      const { data, error } = await supabase
        .from('onboarding_templates')
        .insert({
          ...templateData,
          organization_id: user.organizationId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
      toast.success('Onboarding template created successfully');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Failed to create onboarding template');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<OnboardingTemplate>) => {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('onboarding_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
      toast.success('Template deactivated successfully');
    },
    onError: (error) => {
      console.error('Error deactivating template:', error);
      toast.error('Failed to deactivate template');
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
  };
};

export const useOnboardingTemplate = (templateId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding-template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select(`
          *,
          onboarding_stages (
            *,
            onboarding_tasks (*)
          )
        `)
        .eq('id', templateId)
        .eq('organization_id', user?.organizationId)
        .single();

      if (error) throw error;
      return data as OnboardingTemplate;
    },
    enabled: !!templateId && !!user?.organizationId,
  });
};