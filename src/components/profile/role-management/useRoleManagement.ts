
import { useState } from 'react';
import { UserRole, hasRoleAccess, canManageUser } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UseRoleManagementProps {
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRoleChanged: () => void;
}

export const useRoleManagement = ({ targetUser, onRoleChanged }: UseRoleManagementProps) => {
  const { user: currentUser } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const currentTargetRole = targetUser.role as UserRole;

  // Enhanced role management permissions
  const canManageThisUser = currentUser && (() => {
    // Superadmin can manage everyone except themselves
    if (currentUser.role === 'superadmin' && targetUser.id !== currentUser.id) {
      return true;
    }
    
    // Admin can manage managers and users (but not superadmins or other admins)
    if (currentUser.role === 'admin' && 
        ['manager', 'user'].includes(currentTargetRole) && 
        targetUser.id !== currentUser.id) {
      return true;
    }
    
    // Managers cannot change roles
    return false;
  })();

  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser || !canManageThisUser) return [];
    
    const roles: UserRole[] = [];
    
    if (currentUser.role === 'superadmin') {
      // Superadmin can assign any role except to themselves
      roles.push('user', 'manager', 'admin', 'superadmin');
    } else if (currentUser.role === 'admin') {
      // Admin can only assign user and manager roles
      roles.push('user', 'manager');
    }
    
    return roles.filter(role => role !== currentTargetRole);
  };

  const handleRoleSelect = (role: UserRole) => {
    setNewRole(role);
    setConfirmDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!newRole || !currentUser || !canManageThisUser) return;

    setIsChangingRole(true);
    try {
      // Update in auth metadata
      const { error: authError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        {
          user_metadata: { role: newRole }
        }
      );

      if (authError) {
        console.error('Auth update error:', authError);
      }

      // Update in users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (dbError) {
        throw dbError;
      }

      toast.success(`Role updated to ${newRole} successfully`);
      onRoleChanged();
      setConfirmDialogOpen(false);
      setNewRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
    setNewRole(null);
  };

  return {
    canManageThisUser,
    getAvailableRoles,
    isChangingRole,
    newRole,
    confirmDialogOpen,
    handleRoleSelect,
    handleRoleChange,
    handleDialogClose,
    currentTargetRole
  };
};
