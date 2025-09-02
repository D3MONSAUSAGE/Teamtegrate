
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { RoleChangeValidation, SuperadminTransferData, TransferResponse } from './types';

export const useRoleManagement = (users: any[], refetchUsers: () => void) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const transferSuperadminRole = async (transferData: SuperadminTransferData) => {
    if (!currentUser?.organizationId) {
      throw new Error('Organization ID required');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('transfer_superadmin_role', {
        current_superadmin_id: transferData.currentSuperadminId,
        new_superadmin_id: transferData.targetUserId,
        organization_id: currentUser.organizationId
      });

      if (error) throw error;

      // Fix TypeScript error by proper type assertion
      const response = data as unknown as TransferResponse;

      if (!response.success) {
        throw new Error(response.error);
      }

      // Log audit trail for both users
      await logUserAction('role_change', transferData.currentSuperadminId, '', transferData.currentSuperadminName, 
        { role: 'superadmin' }, { role: 'admin' });
      await logUserAction('role_change', transferData.targetUserId, '', transferData.targetUserName, 
        { role: users?.find(u => u.id === transferData.targetUserId)?.role }, { role: 'superadmin' });

      await refetchUsers();
      toast.success(`Superadmin role transferred from ${transferData.currentSuperadminName} to ${transferData.targetUserName}`);
      return true;
    } catch (error) {
      console.error('Error transferring superadmin role:', error);
      toast.error('Failed to transfer superadmin role');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: UserRole): Promise<{ success: boolean; requiresTransfer?: boolean; transferData?: SuperadminTransferData }> => {
    setIsLoading(true);
    try {
      // Validate role change
      const validation = await validateRoleChange(userId, newRole);
      if (!validation.allowed) {
        toast.error(validation.reason || 'Role change not allowed');
        return { success: false };
      }

      // Check if this requires a superadmin transfer
      if (validation.requires_transfer && validation.current_superadmin_id && validation.current_superadmin_name) {
        const targetUser = users?.find(u => u.id === userId);
        if (!targetUser) {
          throw new Error('Target user not found');
        }

        return {
          success: false,
          requiresTransfer: true,
          transferData: {
            targetUserId: userId,
            targetUserName: targetUser.name,
            currentSuperadminId: validation.current_superadmin_id,
            currentSuperadminName: validation.current_superadmin_name
          }
        };
      }

      // Proceed with normal role change
      const oldUser = users?.find(u => u.id === userId);

      // Use Edge Function to perform the role update with proper backend validation
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: {
          targetUserId: userId,
          newRole: newRole
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to update role');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Role update failed');
      }

      // Log audit trail
      await logUserAction('role_change', userId, oldUser?.email || '', oldUser?.name || '', 
        { role: oldUser?.role }, { role: newRole });

      await refetchUsers();
      toast.success(`User role updated to ${newRole}`);
      return { success: true };
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const validateRoleChange = async (userId: string, newRole: UserRole): Promise<RoleChangeValidation> => {
    if (!currentUser?.id) {
      return { allowed: false, reason: 'Current user required' };
    }

    const { data, error } = await supabase
      .rpc('can_change_user_role', { 
        requester_id: currentUser.id,
        target_user_id: userId,
        new_role: newRole
      });

    if (error) throw error;
    return data as unknown as RoleChangeValidation;
  };

  const bulkChangeRoles = async (userIds: string[], newRole: UserRole) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => changeUserRole(userId, newRole))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
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
    changeUserRole,
    validateRoleChange,
    bulkChangeRoles,
    transferSuperadminRole
  };
};
