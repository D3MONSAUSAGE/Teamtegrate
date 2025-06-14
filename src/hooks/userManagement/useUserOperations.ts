
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useUserOperations = (refetchUsers: () => void) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createUser = async (email: string, name: string, role: UserRole, temporaryPassword: string, users: any[]) => {
    if (!currentUser?.organizationId) {
      throw new Error('Organization ID required');
    }

    // Check if trying to create superadmin when one already exists
    if (role === 'superadmin') {
      const existingSuperadmin = users?.find(u => u.role === 'superadmin');
      if (existingSuperadmin) {
        throw new Error('Cannot create another superadmin. Only one superadmin is allowed per organization.');
      }
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

  const updateUserProfile = async (userId: string, updates: { name?: string; email?: string }, users: any[]) => {
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
        ip_address: null,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  };

  return {
    isLoading,
    createUser,
    updateUserProfile
  };
};
