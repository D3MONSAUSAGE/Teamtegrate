import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
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
      if (!data || data.length === 0) return [];

      // Extract unique IDs
      const userIds = [...new Set(data.map(r => r.user_id))];
      const templateIds = [...new Set(data.map(r => r.template_id))];

      // Fetch both in parallel (not sequential!)
      const [usersResult, templatesResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, email, role')
          .in('id', userIds),
        supabase
          .from('compliance_training_templates')
          .select('id, title, description')
          .in('id', templateIds)
      ]);

      // Build lookup maps for O(1) access
      const usersMap = new Map(usersResult.data?.map(u => [u.id, u]) || []);
      const templatesMap = new Map(templatesResult.data?.map(t => [t.id, t]) || []);

      // Combine data efficiently
      return data.map(record => ({
        ...record,
        user: usersMap.get(record.user_id),
        compliance_training_templates: templatesMap.get(record.template_id)
      }));
    },
    enabled: !!user?.organizationId,
    staleTime: 30000, // Cache for 30 seconds to prevent excessive refetches
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
    onMutate: async (assignmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['compliance-assignments'] });
      
      // Snapshot previous value
      const previousAssignments = queryClient.getQueryData(['compliance-assignments']);
      
      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: ['compliance-assignments'] },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((a: any) => a.id !== assignmentId);
        }
      );
      
      return { previousAssignments };
    },
    onError: (err, assignmentId, context: any) => {
      // Rollback on error
      if (context?.previousAssignments) {
        queryClient.setQueryData(['compliance-assignments'], context.previousAssignments);
      }
      console.error('Error deleting assignment:', err);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
    },
  });
};