
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization_id: string;
  created_at: string;
  assigned_tasks_count: number;
  completed_tasks_count: number;
  role_level: number;
  last_activity?: string;
  is_active: boolean;
}

interface UserImpactAnalysis {
  user_info: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tasks_assigned: number;
  project_tasks_assigned: number;
  projects_managed: number;
  chat_rooms_created: number;
  team_memberships: number;
  is_sole_superadmin: boolean;
  can_be_deleted: boolean;
  deletion_blocked_reason?: string;
}

interface RoleChangeValidation {
  allowed: boolean;
  reason?: string;
}

export const useEnhancedUserManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users with enhanced data
  const { data: users, isLoading: usersLoading, error } = useQuery({
    queryKey: ['enhanced-organization-users', currentUser?.organizationId],
    queryFn: async (): Promise<EnhancedUser[]> => {
      if (!currentUser?.organizationId) {
        throw new Error('User must belong to an organization');
      }

      const { data, error } = await supabase
        .from('organization_user_hierarchy')
        .select('*')
        .eq('organization_id', currentUser.organizationId)
        .order('role_level', { ascending: false })
        .order('name');

      if (error) throw error;

      return data?.map(user => ({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        role: (user.role || 'user') as UserRole,
        organization_id: user.organization_id || '',
        created_at: user.created_at || '',
        assigned_tasks_count: user.assigned_tasks_count || 0,
        completed_tasks_count: user.completed_tasks_count || 0,
        role_level: user.role_level || 0,
        is_active: true,
        last_activity: user.created_at || ''
      })) || [];
    },
    enabled: !!currentUser?.organizationId && currentUser?.role === 'superadmin',
  });

  // Create new user
  const createUser = async (email: string, name: string, role: UserRole, temporaryPassword: string) => {
    if (!currentUser?.organizationId) {
      throw new Error('Organization ID required');
    }

    setIsLoading(true);
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        user_metadata: {
          organization_id: currentUser.organizationId,
          role,
          name
        }
      });

      if (authError) throw authError;

      // Log audit trail
      await logUserAction('create', authData.user.id, email, name, {}, { role, name, email });

      await refetchUsers();
      toast.success(`User ${name} created successfully`);
      return authData.user;
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (userId: string, updates: { name?: string; email?: string }) => {
    setIsLoading(true);
    try {
      const oldUser = users?.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .eq('organization_id', currentUser?.organizationId);

      if (error) throw error;

      // Log audit trail
      await logUserAction('update', userId, oldUser?.email || '', oldUser?.name || '', 
        { name: oldUser?.name, email: oldUser?.email }, updates);

      await refetchUsers();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Change user role with validation
  const changeUserRole = async (userId: string, newRole: UserRole) => {
    setIsLoading(true);
    try {
      // Validate role change
      const validation = await validateRoleChange(userId, newRole);
      if (!validation.allowed) {
        toast.error(validation.reason || 'Role change not allowed');
        return false;
      }

      const oldUser = users?.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('organization_id', currentUser?.organizationId);

      if (error) throw error;

      // Log audit trail
      await logUserAction('role_change', userId, oldUser?.email || '', oldUser?.name || '', 
        { role: oldUser?.role }, { role: newRole });

      await refetchUsers();
      toast.success(`User role updated to ${newRole}`);
      return true;
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user with impact analysis
  const deleteUser = async (userId: string) => {
    if (!currentUser?.id) {
      throw new Error('Current user required');
    }

    setIsLoading(true);
    try {
      // Get impact analysis first
      const impact = await getUserImpactAnalysis(userId);
      if (!impact.can_be_deleted) {
        toast.error(impact.deletion_blocked_reason || 'User cannot be deleted');
        return false;
      }

      // Delete from auth (this cascades to users table)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Log audit trail
      await logUserAction('delete', userId, impact.user_info.email, impact.user_info.name, 
        impact.user_info, {});

      await refetchUsers();
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user impact analysis
  const getUserImpactAnalysis = async (userId: string): Promise<UserImpactAnalysis> => {
    const { data, error } = await supabase
      .rpc('get_user_management_impact', { target_user_id: userId });

    if (error) throw error;
    return data as UserImpactAnalysis;
  };

  // Validate role change
  const validateRoleChange = async (userId: string, newRole: UserRole): Promise<RoleChangeValidation> => {
    if (!currentUser?.id) {
      return { allowed: false, reason: 'Current user required' };
    }

    const { data, error } = await supabase
      .rpc('can_change_user_role', { 
        manager_user_id: currentUser.id,
        target_user_id: userId,
        new_role: newRole
      });

    if (error) throw error;
    return data as RoleChangeValidation;
  };

  // Log user management actions
  const logUserAction = async (
    actionType: string, 
    targetUserId: string, 
    targetEmail: string, 
    targetName: string,
    oldValues: any, 
    newValues: any
  ) => {
    if (!currentUser?.organizationId || !currentUser?.email) return;

    try {
      await supabase.from('user_management_audit').insert({
        organization_id: currentUser.organizationId,
        action_type: actionType,
        target_user_id: targetUserId,
        target_user_email: targetEmail,
        target_user_name: targetName,
        performed_by_user_id: currentUser.id,
        performed_by_email: currentUser.email,
        old_values: oldValues,
        new_values: newValues,
        ip_address: null, // Could be populated from request if needed
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  };

  // Bulk operations
  const bulkChangeRoles = async (userIds: string[], newRole: UserRole) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => changeUserRole(userId, newRole))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast.success(`Successfully updated ${successful} user roles`);
      }
      if (failed > 0) {
        toast.error(`Failed to update ${failed} user roles`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['enhanced-organization-users'] });
    queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
  };

  const isSuperadmin = currentUser?.role === 'superadmin';

  return {
    users: users || [],
    isLoading: usersLoading || isLoading,
    error: error ? (error as Error).message : null,
    isSuperadmin,
    
    // CRUD operations
    createUser,
    updateUserProfile,
    deleteUser,
    
    // Role management
    changeUserRole,
    validateRoleChange,
    bulkChangeRoles,
    
    // Analysis
    getUserImpactAnalysis,
    
    // Utilities
    refetchUsers
  };
};
