
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useResilientUserData } from '../userManagement/useResilientUserData';
import { useEnhancedUserOperations } from '../userManagement/useEnhancedUserOperations';
import { useRoleManagement } from '../userManagement/useRoleManagement';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSuperadminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [transferData, setTransferData] = useState<any>(null);

  // Data hooks with resilience
  const { 
    users, 
    isLoading, 
    error, 
    isUsingFallback 
  } = useResilientUserData();

  // Refetch function
  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['enhanced-organization-users'] });
    queryClient.invalidateQueries({ queryKey: ['basic-organization-users'] });
    queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
  };

  // Operations hooks
  const { 
    isLoading: operationsLoading,
    connectionStatus,
    testConnection,
    createUser,
    updateUserProfile
  } = useEnhancedUserOperations(refetchUsers);

  const {
    isLoading: roleLoading,
    changeUserRole,
    transferSuperadminRole
  } = useRoleManagement(users, refetchUsers);

  // Computed values
  const isSuperadmin = currentUser?.role === 'superadmin';
  const isTransferring = roleLoading;

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    return filtered;
  }, [users, searchTerm, selectedRole]);

  // Handlers
  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      const result = await changeUserRole(userId, newRole);
      if (result.requiresTransfer && result.transferData) {
        setTransferData(result.transferData);
        setTransferDialogOpen(true);
      }
    } catch (error) {
      console.error('Role change failed:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSuperadminTransfer = async (transferData: any) => {
    try {
      await transferSuperadminRole(transferData);
      setTransferDialogOpen(false);
      setTransferData(null);
    } catch (error) {
      console.error('Superadmin transfer failed:', error);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const deleteUser = async (userId: string, deletionReason?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          targetUserId: userId,
          deletionReason: deletionReason || 'User deleted by admin'
        }
      });

      if (error) {
        console.error('Delete user edge function error:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      if (!data?.success) {
        console.error('Delete user failed:', data);
        throw new Error(data?.error || 'Failed to delete user');
      }

      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const onUserCreated = () => {
    setCreateDialogOpen(false);
    refetchUsers();
    toast.success('User created successfully');
  };

  const onUserUpdated = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    refetchUsers();
    toast.success('User updated successfully');
  };

  const onUserDeleted = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    refetchUsers();
    toast.success('User deleted successfully');
  };

  return {
    // Data
    users,
    filteredUsers,
    isLoading: isLoading || operationsLoading,
    error,
    isSuperadmin,
    isUsingFallback,
    connectionStatus,
    
    // Search and filters
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    
    // UI state
    updatingUserId,
    isTransferring,
    createDialogOpen,
    setCreateDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    transferDialogOpen,
    setTransferDialogOpen,
    resetPasswordDialogOpen,
    setResetPasswordDialogOpen,
    selectedUser,
    transferData,
    
    // Actions
    testConnection,
    handleQuickRoleChange,
    handleSuperadminTransfer,
    handleEditUser,
    handleDeleteUser,
    handleResetPassword,
    deleteUser,
    onUserCreated,
    onUserUpdated,
    onUserDeleted
  };
};
