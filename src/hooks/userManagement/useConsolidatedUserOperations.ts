
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useConsolidatedUserOperations = (refetchUsers: () => void) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createUser = async (email: string, name: string, role: UserRole, temporaryPassword: string) => {
    if (!currentUser?.organizationId) {
      throw new Error('Organization ID required');
    }

    setIsLoading(true);
    try {
      console.log('Creating user via Edge Function:', { email, name, role });

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email,
          name,
          role,
          temporaryPassword
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Edge Function returned failure:', data);
        throw new Error(data?.error || 'Failed to create user');
      }

      console.log('User created successfully:', data);
      await refetchUsers();
      toast.success(`User ${name} created successfully`);
      return data.user;
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.message || 'Failed to create user';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, updates: { name?: string; email?: string }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .eq('organization_id', currentUser?.organizationId);

      if (error) throw error;

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

  const deleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log('Deleting user via Edge Function:', userId);

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          targetUserId: userId,
          deletionReason: 'User deleted by admin'
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Edge Function returned failure:', data);
        throw new Error(data?.error || 'Failed to delete user');
      }

      console.log('User deleted successfully:', data);
      await refetchUsers();
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.message || 'Failed to delete user';
      toast.error(errorMessage);
      throw new Error(errorMessage);
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
