
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  created_at: string;
  assigned_tasks_count: number;
  completed_tasks_count: number;
  role_level: number;
}

export const useOrganizationUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchOrganizationUsers = async (): Promise<OrganizationUser[]> => {
    if (!user?.organizationId) {
      throw new Error('User must belong to an organization');
    }

    const { data, error } = await supabase
      .from('organization_user_hierarchy')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('role_level', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching organization users:', error);
      throw new Error(error.message);
    }

    return data || [];
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('organization_id', user?.organizationId);

      if (error) {
        throw error;
      }

      // Invalidate and refetch users data
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
      throw error;
    }
  };

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['organization-users', user?.organizationId],
    queryFn: fetchOrganizationUsers,
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    meta: {
      onError: (err: Error) => {
        console.error('Error in useOrganizationUsers:', err);
        toast.error('Failed to load organization users');
      }
    }
  });

  return {
    users,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    updateUserRole
  };
};
