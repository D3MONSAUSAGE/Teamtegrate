
import { useState } from 'react';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { UserRole } from '@/types';

export const useSuperadminUserManagement = () => {
  const {
    users,
    isLoading,
    error,
    isSuperadmin,
    changeUserRole,
    transferSuperadminRole,
    refetchUsers
  } = useEnhancedUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [transferData, setTransferData] = useState<any>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    
    try {
      const result = await changeUserRole(userId, newRole);
      
      if (result.requiresTransfer && result.transferData) {
        setTransferData(result.transferData);
        setTransferDialogOpen(true);
      }
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSuperadminTransfer = async (transferData: any) => {
    setIsTransferring(true);
    try {
      await transferSuperadminRole(transferData);
    } catch (error) {
      console.error('Error transferring superadmin role:', error);
    } finally {
      setIsTransferring(false);
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

  const onUserDeleted = () => {
    refetchUsers();
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const onUserUpdated = () => {
    refetchUsers();
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const onUserCreated = () => {
    refetchUsers();
    setCreateDialogOpen(false);
  };

  return {
    // Data
    users,
    filteredUsers,
    isLoading,
    error,
    isSuperadmin,
    
    // Search and filters
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    
    // State
    updatingUserId,
    isTransferring,
    
    // Dialog states
    createDialogOpen,
    setCreateDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    transferDialogOpen,
    setTransferDialogOpen,
    selectedUser,
    transferData,
    
    // Actions
    handleQuickRoleChange,
    handleSuperadminTransfer,
    handleEditUser,
    handleDeleteUser,
    onUserDeleted,
    onUserUpdated,
    onUserCreated
  };
};
