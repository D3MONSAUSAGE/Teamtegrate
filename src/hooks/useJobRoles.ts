import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JobRole, UserJobRole, TeamJobRole } from '@/types';
import { toast } from 'sonner';

export const useJobRoles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization job roles
  const { data: jobRoles = [], isLoading, error } = useQuery({
    queryKey: ['job-roles', user?.organizationId],
    queryFn: async (): Promise<JobRole[]> => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  // Create job role
  const createJobRole = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user?.organizationId) throw new Error('No organization found');
      
      const { data, error } = await supabase
        .from('job_roles')
        .insert({
          organization_id: user.organizationId,
          name,
          description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-roles'] });
      toast.success('Job role created successfully');
    },
    onError: (error) => {
      console.error('Error creating job role:', error);
      toast.error('Failed to create job role');
    }
  });

  // Update job role
  const updateJobRole = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      description 
    }: { 
      id: string; 
      name?: string; 
      description?: string; 
    }) => {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      const { data, error } = await supabase
        .from('job_roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-roles'] });
      toast.success('Job role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating job role:', error);
      toast.error('Failed to update job role');
    }
  });

  // Toggle job role active status
  const toggleJobRoleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('job_roles')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-roles'] });
      toast.success('Job role status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating job role status:', error);
      toast.error('Failed to update job role status');
    }
  });

  // Delete job role
  const deleteJobRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-roles'] });
      toast.success('Job role deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting job role:', error);
      toast.error('Failed to delete job role');
    }
  });

  const canManageJobRoles = user?.role && ['superadmin', 'admin', 'manager'].includes(user.role);

  return {
    jobRoles,
    isLoading,
    error,
    canManageJobRoles,
    createJobRole: createJobRole.mutate,
    updateJobRole: updateJobRole.mutate,
    toggleJobRoleStatus: toggleJobRoleStatus.mutate,
    deleteJobRole: deleteJobRole.mutate,
    isCreating: createJobRole.isPending,
    isUpdating: updateJobRole.isPending,
    isDeleting: deleteJobRole.isPending
  };
};