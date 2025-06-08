
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

  const canManageThisUser = currentUser && 
    hasRoleAccess(currentUser.role, 'admin') && 
    canManageUser(currentUser.role, currentTargetRole);

  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser) return [];
    
    const roles: UserRole[] = [];
    
    // Users can always be demoted to user level
    roles.push('user');
    
    // Add roles based on current user's permissions
    if (hasRoleAccess(currentUser.role, 'manager')) {
      roles.push('manager');
    }
    
    if (hasRoleAccess(currentUser.role, 'admin')) {
      roles.push('admin');
    }
    
    // Only superadmins can create other superadmins
    if (currentUser.role === 'superadmin') {
      roles.push('superadmin');
    }
    
    return roles.filter(role => role !== currentTargetRole);
  };

  const handleRoleSelect = (role: UserRole) => {
    setNewRole(role);
    setConfirmDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!newRole || !currentUser) return;

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
