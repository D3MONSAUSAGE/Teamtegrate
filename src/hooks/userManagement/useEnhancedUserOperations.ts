
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { edgeFunctionManager } from '@/utils/edgeFunctionManager';

export const useEnhancedUserOperations = (refetchUsers: () => void) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Test Edge Function connectivity
  const testConnection = async () => {
    if (!currentUser?.organizationId) return false;
    
    try {
      setConnectionStatus('unknown');
      const isConnected = await edgeFunctionManager.validateConnection(supabase);
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

    // Check if trying to create superadmin when one already exists
    if (role === 'superadmin') {
      const existingSuperadmin = users?.find(u => u.role === 'superadmin');
      if (existingSuperadmin) {
        throw new Error('Cannot create another superadmin. Only one superadmin is allowed per organization.');
      }
    }

    setIsLoading(true);
    try {
      console.log('EnhancedUserOperations: Creating user via Edge Function:', { email, name, role });

      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to user creation service. Please check your connection.');
      }

      // Call the Edge Function with enhanced error handling
      const result = await edgeFunctionManager.invoke(
        supabase,
        'admin-create-user',
        {
          email,
          name,
          role,
          temporaryPassword
        },
        {
          timeout: 45000, // 45 seconds for user creation
          maxRetries: 2
        }
      );

      if (result.error) {
        console.error('EnhancedUserOperations: Edge Function error:', result.error);
        throw result.error;
      }

      if (!result.data?.success) {
        console.error('EnhancedUserOperations: Edge Function returned failure:', result.data);
        throw new Error(result.data?.error || 'Failed to create user');
      }

      console.log('EnhancedUserOperations: User created successfully:', result.data);

      await refetchUsers();
      toast.success(`User ${name} created successfully`);
      return result.data.user;
    } catch (error: any) {
      console.error('EnhancedUserOperations: Error creating user:', error);
      
      // Enhanced error messaging
      let errorMessage = error.message || 'Failed to create user';
      
      if (errorMessage.includes('timeout')) {
        errorMessage = 'User creation timed out. Please try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network connection issue. Please check your connection and try again.';
      } else if (errorMessage.includes('Edge Function')) {
        errorMessage = 'User creation service error. Please try again.';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
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
      console.error('EnhancedUserOperations: Error updating user:', error);
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
