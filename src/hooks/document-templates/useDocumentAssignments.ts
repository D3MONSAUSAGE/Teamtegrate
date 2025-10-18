import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EmployeeDocumentAssignment, CreateAssignmentRequest } from '@/types/document-templates';

export const useDocumentAssignments = (templateId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['document-assignments', user?.organizationId, templateId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization ID');

      let query = supabase
        .from('employee_document_assignments' as any)
        .select(`
          *,
          template:employee_document_templates(*)
        `)
        .eq('organization_id', user.organizationId);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query.order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as unknown as EmployeeDocumentAssignment[];
    },
    enabled: !!user?.organizationId,
  });

  const createAssignment = useMutation({
    mutationFn: async (assignment: CreateAssignmentRequest) => {
      if (!user?.organizationId || !user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('employee_document_assignments' as any)
        .insert({
          ...assignment,
          organization_id: user.organizationId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-tracking'] });
      toast.success('Template assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign template: ${error.message}`);
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_document_assignments' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-tracking'] });
      toast.success('Assignment removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove assignment: ${error.message}`);
    },
  });

  return {
    assignments: assignments || [],
    isLoading,
    createAssignment,
    deleteAssignment,
  };
};
