import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { toast } from '@/components/ui/sonner';

export interface ComplianceRetrainingAssignment {
  id: string;
  user_id: string;
  organization_id: string;
  template_id: string;
  course_id: string;
  is_completed: boolean;
  completion_date?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const useComplianceRecords = (searchTerm?: string, filters?: {
  status?: string;
  templateId?: string;
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['compliance-records', searchTerm, filters],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      // Get compliance records
      let query = supabase
        .from('compliance_training_records')
        .select('*')
        .eq('organization_id', user.organizationId);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'completed') {
          query = query.eq('is_completed', true);
        } else if (filters.status === 'pending') {
          query = query.eq('is_completed', false);
        }
      }
      
      if (filters?.templateId && filters.templateId !== 'all') {
        query = query.eq('template_id', filters.templateId);
      }

      const { data: records, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!records || records.length === 0) return [];

      // Get user data
      const userIds = [...new Set(records.map(r => r.user_id))];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds);

      if (usersError) throw usersError;

      const userLookup = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      const result = records.map(record => ({
        ...record,
        user: userLookup[record.user_id] || null
      }));

      // Apply search filter
      const filteredResult = searchTerm ? 
        result.filter(record => 
          record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ) : result;

      return filteredResult;
    },
    enabled: !!user?.organizationId
  });
};

export const useForceComplianceRetraining = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ recordId, reason }: { recordId: string; reason: string }) => {
      if (!user?.organizationId) {
        throw new Error('Organization ID is required');
      }

      // Reset the completion status
      const { error } = await supabase
        .from('compliance_training_records')
        .update({
          is_completed: false,
          completion_date: null,
          completion_notes: `Retraining required: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .eq('organization_id', user.organizationId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      enhancedNotifications.success('Compliance retraining required successfully');
    },
    onError: (error) => {
      console.error('Error forcing compliance retraining:', error);
      enhancedNotifications.error('Failed to require compliance retraining');
    }
  });
};

export const useReassignCompliance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      recordId, 
      newUserId, 
      reason 
    }: { 
      recordId: string; 
      newUserId: string; 
      reason: string;
    }) => {
      if (!user?.organizationId) {
        throw new Error('Organization ID is required');
      }

      // Get the original record
      const { data: originalRecord, error: fetchError } = await supabase
        .from('compliance_training_records')
        .select('*')
        .eq('id', recordId)
        .eq('organization_id', user.organizationId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalRecord) throw new Error('Original record not found');

      // Create new record for the new user
      const { error: insertError } = await supabase
        .from('compliance_training_records')
        .insert({
          organization_id: user.organizationId,
          user_id: newUserId,
          template_id: originalRecord.template_id,
          course_id: originalRecord.course_id,
          language_selected: originalRecord.language_selected,
          role_classification: originalRecord.role_classification,
          external_training_url: originalRecord.external_training_url,
          is_completed: false,
          completion_notes: `Reassigned from user ${originalRecord.user_id}. Reason: ${reason}`
        });

      if (insertError) throw insertError;

      // Mark original as reassigned (add note)
      const { error: updateError } = await supabase
        .from('compliance_training_records')
        .update({
          completion_notes: (originalRecord.completion_notes || '') + 
            ` [REASSIGNED to user ${newUserId} on ${new Date().toISOString()}. Reason: ${reason}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      enhancedNotifications.success('Compliance training reassigned successfully');
    },
    onError: (error) => {
      console.error('Error reassigning compliance:', error);
      enhancedNotifications.error('Failed to reassign compliance training');
    }
  });
};

export const useComplianceTemplates = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['compliance-templates'],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('compliance_training_templates')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId
  });
};