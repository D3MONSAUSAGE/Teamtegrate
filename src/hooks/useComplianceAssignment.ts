import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { enhancedNotifications } from '@/utils/enhancedNotifications';
import { toast } from '@/components/ui/sonner';

export interface ComplianceAssignment {
  id: string;
  user_id: string;
  organization_id: string;
  template_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  is_completed: boolean;
  completion_date?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface BulkAssignmentData {
  templateId: string;
  userIds: string[];
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export const useUsers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['users', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('organization_id', user.organizationId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });
};

export const useComplianceTemplates = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['compliance-templates', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('compliance_training_templates')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });
};

export const useAssignCompliance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, userId, dueDate, priority = 'medium', notes }: {
      templateId: string;
      userId: string;
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high';
      notes?: string;
    }) => {
      if (!user?.id || !user.organizationId) {
        throw new Error('User not authenticated');
      }

      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('compliance_training_records')
        .select('id')
        .eq('user_id', userId)
        .eq('template_id', templateId)
        .maybeSingle();

      if (existing) {
        throw new Error('User already has this compliance training assigned');
      }

      const { data, error } = await supabase
        .from('compliance_training_records')
        .insert({
          user_id: userId,
          organization_id: user.organizationId,
          template_id: templateId,
          is_completed: false,
          language_selected: 'en',
          role_classification: 'employee'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
      
      toast.success('Compliance training assigned successfully');
      enhancedNotifications.success('Compliance training assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Error assigning compliance training:', error);
      toast.error(error.message || 'Failed to assign compliance training');
      enhancedNotifications.error(error.message || 'Failed to assign compliance training');
    },
  });
};

export const useBulkAssignCompliance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, userIds, dueDate, priority = 'medium', notes }: BulkAssignmentData) => {
      if (!user?.id || !user.organizationId) {
        throw new Error('User not authenticated');
      }

      // Check for existing assignments
      const { data: existingAssignments } = await supabase
        .from('compliance_training_records')
        .select('user_id')
        .eq('template_id', templateId)
        .in('user_id', userIds);

      const existingUserIds = existingAssignments?.map(a => a.user_id) || [];
      const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

      if (newUserIds.length === 0) {
        throw new Error('All selected users already have this compliance training assigned');
      }

      const assignments = newUserIds.map(userId => ({
        user_id: userId,
        organization_id: user.organizationId,
        template_id: templateId,
        is_completed: false,
        language_selected: 'en',
        role_classification: 'employee'
      }));

      const { data, error } = await supabase
        .from('compliance_training_records')
        .insert(assignments)
        .select();

      if (error) throw error;

      return {
        assigned: data.length,
        skipped: existingUserIds.length,
        total: userIds.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
      
      const message = `Successfully assigned to ${result.assigned} users${result.skipped > 0 ? ` (${result.skipped} already assigned)` : ''}`;
      toast.success(message);
      enhancedNotifications.success(message);
    },
    onError: (error: Error) => {
      console.error('Error bulk assigning compliance training:', error);
      toast.error(error.message || 'Failed to bulk assign compliance training');
      enhancedNotifications.error(error.message || 'Failed to bulk assign compliance training');
    },
  });
};

export const useComplianceAssignments = (filters?: {
  templateId?: string;
  userId?: string;
  status?: 'all' | 'pending' | 'completed';
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['compliance-assignments', filters],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      let query = supabase
        .from('compliance_training_records')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (filters?.templateId && filters.templateId !== 'all') {
        query = query.eq('template_id', filters.templateId);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('is_completed', filters.status === 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user data separately to avoid RLS issues
      const userIds = data?.map(record => record.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds);

      // Fetch template data separately
      const templateIds = data?.map(record => record.template_id) || [];
      if (templateIds.length === 0) return [];

      const { data: templates } = await supabase
        .from('compliance_training_templates')
        .select('id, title, description')
        .in('id', templateIds);

      // Combine the data
      return data?.map(record => ({
        ...record,
        user: users?.find(u => u.id === record.user_id),
        compliance_training_templates: templates?.find(t => t.id === record.template_id)
      })) || [];
    },
    enabled: !!user?.organizationId,
  });
};

export const useDeleteComplianceAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('compliance_training_records')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
      
      toast.success('Assignment deleted successfully');
      enhancedNotifications.success('Assignment deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
      enhancedNotifications.error('Failed to delete assignment');
    },
  });
};