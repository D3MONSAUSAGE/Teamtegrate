
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { userManagementService } from '@/services/userManagementService';

export const useConsolidatedUserOperations = (refetchUsers: () => void) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createUser = async (email: string, name: string, role: UserRole, temporaryPassword: string) => {
    if (!currentUser?.organizationId) {
      throw new Error('Organization ID required');
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
      await refetchUsers();
      return user;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, updates: { name?: string; email?: string }) => {
    setIsLoading(true);
    try {
      await userManagementService.updateUserProfile(userId, updates);
      await refetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await userManagementService.deleteUser(userId, 'User deleted by admin');
      await refetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createUser,
    updateUserProfile,
    deleteUser
  };
};
