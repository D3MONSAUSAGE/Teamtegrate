
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { userManagementService } from '@/services/userManagementService';

export const useConsolidatedUserOperations = (refetchUsers: () => Promise<void>) => {
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

      console.log('Creating user...');
      const user = await userManagementService.createUser(userData);
      console.log('User created, refetching data...');
      await refetchUsers();
      console.log('✅ User creation complete and data refreshed');
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
      console.log('Updating user profile...');
      await userManagementService.updateUserProfile(userId, updates);
      console.log('Profile updated, refetching data...');
      await refetchUsers();
      console.log('✅ Profile update complete and data refreshed');
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
      console.log('Deleting user...');
      await userManagementService.deleteUser(userId, 'User deleted by admin');
      console.log('User deleted, refetching data...');
      await refetchUsers();
      console.log('✅ User deletion complete and data refreshed');
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
