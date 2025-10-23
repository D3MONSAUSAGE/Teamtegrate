import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { OffboardingFormData, OffboardingRecord, ChecklistUpdate } from '@/types/offboarding';

export const useOffboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch offboarding record for a user
  const getOffboardingRecord = (userId: string) => {
    return useQuery({
      queryKey: ['offboarding', userId],
      queryFn: async (): Promise<OffboardingRecord | null> => {
      const { data, error } = await supabase
        .from('employee_offboarding')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No record found
        throw error;
      }
      return data as OffboardingRecord;
      },
      enabled: !!userId,
    });
  };

  // Initiate offboarding process
  const initiateOffboarding = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: OffboardingFormData }) => {
      if (!user?.organizationId) throw new Error('Organization ID required');

      // Create offboarding record
      const { data: offboardingRecord, error: offboardingError } = await supabase
        .from('employee_offboarding')
        .insert({
          organization_id: user.organizationId,
          user_id: userId,
          initiated_by: user.id,
          termination_date: data.termination_date,
          last_day_worked: data.last_day_worked || null,
          termination_type: data.termination_type,
          termination_reason: data.termination_reason,
          eligible_for_rehire: data.eligible_for_rehire,
          offboarding_notes: data.offboarding_notes || null,
          status: 'in_progress',
        })
        .select()
        .single();

      if (offboardingError) throw offboardingError;
      
      const record = offboardingRecord as unknown as OffboardingRecord;

      // Update user record
      const { error: userError } = await supabase
        .from('users')
        .update({
          employment_status: 'terminated',
          termination_date: data.termination_date,
          last_day_worked: data.last_day_worked || null,
          termination_reason: data.termination_reason,
          termination_notes: data.offboarding_notes || null,
          eligible_for_rehire: data.eligible_for_rehire,
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Revoke access immediately if requested
      if (data.revoke_access_immediately) {
        const { error: revokeError } = await supabase.rpc('revoke_user_access', {
          target_user_id: userId,
        });
        if (revokeError) throw revokeError;
      }

      return record;
    },
    onSuccess: () => {
      toast.success('Offboarding process initiated');
      queryClient.invalidateQueries({ queryKey: ['offboarding'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-organization-users'] });
    },
    onError: (error: any) => {
      console.error('Error initiating offboarding:', error);
      toast.error(error.message || 'Failed to initiate offboarding');
    },
  });

  // Update offboarding checklist
  const updateChecklist = useMutation({
    mutationFn: async ({ offboardingId, updates }: { offboardingId: string; updates: ChecklistUpdate }) => {
      const { data, error } = await supabase
        .from('employee_offboarding')
        .update(updates)
        .eq('id', offboardingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Checklist updated');
      queryClient.invalidateQueries({ queryKey: ['offboarding'] });
    },
    onError: (error: any) => {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
    },
  });

  // Complete offboarding
  const completeOffboarding = useMutation({
    mutationFn: async (offboardingId: string) => {
      if (!user?.id) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('employee_offboarding')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq('id', offboardingId)
        .select()
        .single();

      if (error) throw error;

      // Update user record
      await supabase
        .from('users')
        .update({ offboarding_completed: true })
        .eq('id', data.user_id);

      return data;
    },
    onSuccess: () => {
      toast.success('Offboarding completed');
      queryClient.invalidateQueries({ queryKey: ['offboarding'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-organization-users'] });
    },
    onError: (error: any) => {
      console.error('Error completing offboarding:', error);
      toast.error('Failed to complete offboarding');
    },
  });

  // Revoke access manually
  const revokeAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('revoke_user_access', {
        target_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Access revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['offboarding'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    },
  });

  return {
    getOffboardingRecord,
    initiateOffboarding,
    updateChecklist,
    completeOffboarding,
    revokeAccess,
  };
};
