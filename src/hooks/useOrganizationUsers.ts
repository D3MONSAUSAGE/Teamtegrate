
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

    console.log('Fetching organization users for org:', user.organizationId);
    console.log('Current user role:', user.role);

    // Try the hierarchy view first
    let { data: hierarchyData, error: hierarchyError } = await supabase
      .from('organization_user_hierarchy')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('role_level', { ascending: false })
      .order('name');

    if (!hierarchyError && hierarchyData && hierarchyData.length > 0) {
      console.log('Using hierarchy view, found users:', hierarchyData.length);
      return hierarchyData.map(user => ({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        organization_id: user.organization_id || '',
        created_at: user.created_at || '',
        assigned_tasks_count: user.assigned_tasks_count || 0,
        completed_tasks_count: user.completed_tasks_count || 0,
        role_level: user.role_level || 0,
      }));
    }

    // Fallback to direct users table query
    console.log('Hierarchy view failed or empty, falling back to users table');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, created_at')
      .eq('organization_id', user.organizationId)
      .order('name');

    if (userError) {
      console.error('Error fetching users from users table:', userError);
      throw new Error(userError.message);
    }

    console.log('Direct users query found:', userData?.length || 0, 'users');
    
    return userData?.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      organization_id: user.organization_id,
      created_at: user.created_at,
      assigned_tasks_count: 0,
      completed_tasks_count: 0,
      role_level: getRoleLevel(user.role),
    })) || [];
  };

  const getRoleLevel = (role: string): number => {
    switch (role) {
      case 'superadmin': return 4;
      case 'admin': return 3;
      case 'manager': return 2;
      case 'user': return 1;
      default: return 0;
    }
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
