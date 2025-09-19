
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { userManagementService } from '@/services/userManagementService';

interface EdgeFunctionResponse {
  success?: boolean;
  error?: string;
  user?: any;
}

export const useEnhancedUserOperations = (refetchUsers: () => void) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Test Edge Function connectivity
  const testConnection = async (): Promise<boolean> => {
    if (!currentUser?.organizationId) return false;
    
    try {
      setConnectionStatus('unknown');
      const { data, error } = await supabase.functions.invoke('health-check');
      const isConnected = !error && data?.status === 'ok';
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  const createUser = async (email: string, name: string, role: UserRole, temporaryPassword: string, users: any[]) => {
    if (!currentUser?.organizationId) {
      throw new Error('Organization ID required');
    }

    // Check if there are already superadmins in the organization
    const existingSuperadmins = users?.filter(user => user.role === 'superadmin').length || 0;
    
    if (role === 'superadmin') {
      if (existingSuperadmins >= 1) {
        throw new Error('Only one superadmin is allowed per organization');
      }
    }

    // Test connection before proceeding
    try {
      await testConnection();
    } catch (error: any) {
      throw new Error(`Connection test failed: ${error.message}`);
    }

    setIsLoading(true);
    try {
      const userData = {
        email,
        name,
        role,
        temporaryPassword
      };

      const user = await userManagementService.createUser(userData);

      // Log the user creation action
      await logUserAction(
        'create',
        user?.id || 'unknown',
        email,
        name,
        {},
        { email, name, role }
      );

      await refetchUsers();
      return user;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, updates: { name?: string; email?: string }, users: any[]) => {
    setIsLoading(true);
    try {
      const oldUser = users?.find(u => u.id === userId);
      const oldValues = { name: oldUser?.name, email: oldUser?.email };

      await userManagementService.updateUserProfile(userId, updates);

      // Log the update action
      await logUserAction(
        'update',
        userId,
        oldUser?.email || updates.email || '',
        oldUser?.name || updates.name || '',
        oldValues,
        updates
      );

      await refetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
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
      console.error('EnhancedUserOperations: Error logging user action:', error);
    }
  };

  return {
    isLoading,
    connectionStatus,
    testConnection,
    createUser,
    updateUserProfile
  };
};
