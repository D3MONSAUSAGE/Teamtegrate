import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// V2 Template Types
export interface ChecklistTemplateV2 {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignment_type: 'team' | 'role';
  team_id?: string;
  role_key?: string;
  start_time?: string;
  end_time?: string;
  scheduled_days: string[];
  require_verification: boolean;
  scoring_enabled: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateItemV2 {
  id: string;
  template_id: string;
  label: string;
  instructions?: string;
  position: number;
  requires_photo: boolean;
  requires_note: boolean;
  default_value?: any;
  created_at: string;
}

export interface ChecklistTemplateFormData {
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignment_type: 'team' | 'role';
  team_id?: string;
  role_key?: string;
  start_time?: string;
  end_time?: string;
  scheduled_days: string[];
  require_verification: boolean;
  scoring_enabled: boolean;
  items: Array<{
    label: string;
    instructions?: string;
    position: number;
    requires_photo: boolean;
    requires_note: boolean;
    default_value?: any;
  }>;
}

/**
 * Fetch all checklist templates V2
 */
export const useChecklistTemplatesV2 = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['checklist-templates-v2', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) {
        throw new Error('User organization not found');
      }

      const { data, error } = await supabase
        .from('checklist_templates_v2')
        .select('*')
        .eq('org_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChecklistTemplateV2[];
    },
    enabled: !!user?.organizationId,
  });
};

/**
 * Fetch single template with items
 */
export const useChecklistTemplateV2 = (templateId: string | null) => {
  return useQuery({
    queryKey: ['checklist-template-v2', templateId],
    queryFn: async () => {
      if (!templateId) throw new Error('Template ID required');

      const { data, error } = await supabase
        .from('checklist_templates_v2')
        .select(`
          *,
          items:checklist_template_items_v2(*)
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });
};

/**
 * Create new template
 */
export const useCreateChecklistTemplateV2 = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: ChecklistTemplateFormData) => {
      if (!user) throw new Error('User not authenticated');
      if (!user.organizationId) throw new Error('User organization not found');

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates_v2')
        .insert({
          org_id: user.organizationId,
          name: formData.name,
          description: formData.description,
          priority: formData.priority,
          assignment_type: formData.assignment_type,
          team_id: formData.team_id,
          role_key: formData.role_key,
          start_time: formData.start_time,
          end_time: formData.end_time,
          scheduled_days: formData.scheduled_days,
          require_verification: formData.require_verification,
          scoring_enabled: formData.scoring_enabled,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create items
      if (formData.items.length > 0) {
        const items = formData.items.map((item, index) => ({
          template_id: template.id,
          label: item.label,
          instructions: item.instructions,
          position: index,
          requires_photo: item.requires_photo,
          requires_note: item.requires_note,
          default_value: item.default_value || {},
        }));

        const { error: itemsError } = await supabase
          .from('checklist_template_items_v2')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates-v2'] });
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Update existing template
 */
export const useUpdateChecklistTemplateV2 = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ChecklistTemplateFormData }) => {
      if (!user) throw new Error('User not authenticated');

      // Update template
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates_v2')
        .update({
          name: formData.name,
          description: formData.description,
          priority: formData.priority,
          assignment_type: formData.assignment_type,
          team_id: formData.team_id,
          role_key: formData.role_key,
          start_time: formData.start_time,
          end_time: formData.end_time,
          scheduled_days: formData.scheduled_days,
          require_verification: formData.require_verification,
          scoring_enabled: formData.scoring_enabled,
        })
        .eq('id', id)
        .select()
        .single();

      if (templateError) throw templateError;

      // Delete existing items
      await supabase
        .from('checklist_template_items_v2')
        .delete()
        .eq('template_id', id);

      // Create new items
      if (formData.items.length > 0) {
        const items = formData.items.map((item, index) => ({
          template_id: id,
          label: item.label,
          instructions: item.instructions,
          position: index,
          requires_photo: item.requires_photo,
          requires_note: item.requires_note,
          default_value: item.default_value || {},
        }));

        const { error: itemsError } = await supabase
          .from('checklist_template_items_v2')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates-v2'] });
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Toggle template active status
 */
export const useToggleTemplateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('checklist_templates_v2')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates-v2'] });
      toast({
        title: 'Success',
        description: `Template ${variables.is_active ? 'activated' : 'deactivated'}`,
      });
    },
    onError: (error) => {
      console.error('Error toggling template status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Delete template
 */
export const useDeleteChecklistTemplateV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Items will be deleted by CASCADE
      const { error } = await supabase
        .from('checklist_templates_v2')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates-v2'] });
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });
};
