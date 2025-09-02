import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserJobRole } from '@/types';
import { toast } from 'sonner';

export const useUserJobRoles = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's job roles
  const { data: userJobRoles = [], isLoading } = useQuery({
    queryKey: ['user-job-roles', userId || user?.id, user?.organizationId],
    queryFn: async (): Promise<UserJobRole[]> => {
      if (!user?.organizationId) return [];
      const targetUserId = userId || user.id;
      
      const { data, error } = await supabase
        .from('user_job_roles')
        .select(`
          *,
          job_role:job_roles(*)
        `)
        .eq('organization_id', user.organizationId)
        .eq('user_id', targetUserId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId && !!(userId || user?.id),
  });

  // Assign job role to user
  const assignJobRole = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      jobRoleId, 
      isPrimary = false 
    }: { 
      targetUserId: string; 
      jobRoleId: string; 
      isPrimary?: boolean; 
    }) => {
      if (!user?.organizationId) throw new Error('No organization found');
      
      // If setting as primary, clear other primary roles first
      if (isPrimary) {
        await supabase
          .from('user_job_roles')
          .update({ is_primary: false })
          .eq('organization_id', user.organizationId)
          .eq('user_id', targetUserId);
      }

      const { data, error } = await supabase
        .from('user_job_roles')
        .insert({
          organization_id: user.organizationId,
          user_id: targetUserId,
          job_role_id: jobRoleId,
          is_primary: isPrimary
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-job-roles'] });
      toast.success('Job role assigned successfully');
    },
    onError: (error: any) => {
      console.error('Error assigning job role:', error);
      if (error.code === '23505') {
        toast.error('User already has this job role');
      } else {
        toast.error('Failed to assign job role');
      }
    }
  });

  // Remove job role from user
  const removeJobRole = useMutation({
    mutationFn: async (userJobRoleId: string) => {
      const { error } = await supabase
        .from('user_job_roles')
        .delete()
        .eq('id', userJobRoleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-job-roles'] });
      toast.success('Job role removed successfully');
    },
    onError: (error) => {
      console.error('Error removing job role:', error);
      toast.error('Failed to remove job role');
    }
  });

  // Set primary job role
  const setPrimaryJobRole = useMutation({
    mutationFn: async ({ targetUserId, jobRoleId }: { targetUserId: string; jobRoleId: string }) => {
      if (!user?.organizationId) throw new Error('No organization found');
      
      // First, clear all primary flags for this user
      await supabase
        .from('user_job_roles')
        .update({ is_primary: false })
        .eq('organization_id', user.organizationId)
        .eq('user_id', targetUserId);

      // Then set the specified role as primary
      const { error } = await supabase
        .from('user_job_roles')
        .update({ is_primary: true })
        .eq('organization_id', user.organizationId)
        .eq('user_id', targetUserId)
        .eq('job_role_id', jobRoleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-job-roles'] });
      toast.success('Primary job role updated successfully');
    },
    onError: (error) => {
      console.error('Error setting primary job role:', error);
      toast.error('Failed to set primary job role');
    }
  });

  const primaryJobRole = userJobRoles.find(ujr => ujr.is_primary);
  const canManageJobRoles = user?.role && ['superadmin', 'admin', 'manager'].includes(user.role);

  return {
    userJobRoles,
    primaryJobRole,
    isLoading,
    canManageJobRoles,
    assignJobRole: assignJobRole.mutate,
    removeJobRole: removeJobRole.mutate,
    setPrimaryJobRole: setPrimaryJobRole.mutate,
    isAssigning: assignJobRole.isPending,
    isRemoving: removeJobRole.isPending,
    isUpdatingPrimary: setPrimaryJobRole.isPending
  };
};