import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

export interface UserUpdateData {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  address?: string;
  employee_id?: string;
  hire_date?: string;
  preferred_name?: string;
  department?: string;
  job_title?: string;
  manager_id?: string;
  avatar_url?: string;
}

export interface UserCreationData extends UserUpdateData {
  email: string;
  name: string;
  role: UserRole;
  temporaryPassword: string;
}

/**
 * Central User Management Service
 * Single source of truth for all user operations across the application
 */
class UserManagementService {
  /**
   * Update user profile with comprehensive sync across all systems
   */
  async updateUserProfile(userId: string, updates: UserUpdateData): Promise<void> {
    try {
      console.log('🔄 UserManagementService: Starting profile update for:', userId, updates);
      
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No authenticated user');

      const isOwnProfile = currentUser.user.id === userId;
      const isEmailChange = updates.email && updates.email !== currentUser.user.email;
      
      // Step 1: Update auth system (only for own profile)
      if (isOwnProfile && (updates.name || updates.email)) {
        await this.updateAuthProfile({
          name: updates.name,
          email: updates.email
        });
      }

      // Step 2: Update database with full sync
      await this.updateDatabaseProfile(userId, updates);

      // Step 3: Trigger profile sync across all tables
      await this.syncProfileAcrossAllTables(userId);

      // Step 4: Handle special cases (email change notifications, etc.)
      if (isEmailChange) {
        await this.handleEmailChange(userId, updates.email!);
      }

      console.log('✅ UserManagementService: Profile update completed successfully');
      toast.success('Profile updated successfully');
      
    } catch (error) {
      console.error('❌ UserManagementService: Profile update failed:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  }

  /**
   * Create new user with comprehensive setup
   */
  async createUser(userData: UserCreationData): Promise<any> {
    try {
      console.log('🔄 UserManagementService: Creating user:', userData.email);

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: userData
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create user');

      // Trigger profile sync for new user
      if (data.user?.id) {
        await this.syncProfileAcrossAllTables(data.user.id);
      }

      console.log('✅ UserManagementService: User created successfully');
      toast.success(`User ${userData.name} created successfully`);
      
      return data.user;
    } catch (error) {
      console.error('❌ UserManagementService: User creation failed:', error);
      toast.error('Failed to create user');
      throw error;
    }
  }

  /**
   * Change user role with comprehensive validation and sync
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      console.log('🔄 UserManagementService: Changing user role:', userId, newRole);

      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to change role');

      // Trigger comprehensive sync after role change
      await this.syncProfileAcrossAllTables(userId);

      console.log('✅ UserManagementService: Role changed successfully');
      toast.success('User role updated successfully');
      
    } catch (error) {
      console.error('❌ UserManagementService: Role change failed:', error);
      toast.error('Failed to change user role');
      throw error;
    }
  }

  /**
   * Delete user with comprehensive cleanup
   */
  async deleteUser(userId: string, reason: string = 'Admin deletion'): Promise<void> {
    try {
      console.log('🔄 UserManagementService: Deleting user:', userId);

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          targetUserId: userId,
          deletionReason: reason
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to delete user');

      console.log('✅ UserManagementService: User deleted successfully');
      toast.success('User deleted successfully');
      
    } catch (error) {
      console.error('❌ UserManagementService: User deletion failed:', error);
      toast.error('Failed to delete user');
      throw error;
    }
  }

  /**
   * Sync profile data across all systems (auth, database, views)
   */
  async syncUserData(userId?: string): Promise<void> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('No user ID provided');

      console.log('🔄 UserManagementService: Syncing user data for:', targetUserId);

      // Call database function to sync across all tables
      await this.syncProfileAcrossAllTables(targetUserId);

      // Sync auth with database
      await this.syncAuthWithDatabase(targetUserId);

      console.log('✅ UserManagementService: Data sync completed successfully');
      toast.success('User data synced successfully');
      
    } catch (error) {
      console.error('❌ UserManagementService: Data sync failed:', error);
      toast.error('Failed to sync user data');
      throw error;
    }
  }

  /**
   * Private method: Update auth profile
   */
  private async updateAuthProfile(updates: { name?: string; email?: string }): Promise<void> {
    const updateData: any = {};
    
    if (updates.name) {
      updateData.data = { name: updates.name };
    }
    
    if (updates.email) {
      updateData.email = updates.email;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;
      
      if (updates.email) {
        toast.info('Email confirmation sent. Please check your new email to confirm the change.');
      }
    }
  }

  /**
   * Private method: Update database profile
   */
  private async updateDatabaseProfile(userId: string, updates: UserUpdateData): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Private method: Sync profile across all database tables
   */
  private async syncProfileAcrossAllTables(userId: string): Promise<void> {
    const { error } = await supabase.rpc('sync_user_profile_across_tables', {
      user_id: userId
    });

    if (error) {
      console.error('Failed to sync profile across tables:', error);
      // Don't throw here - this is a background sync operation
    }
  }

  /**
   * Private method: Handle email change special logic
   */
  private async handleEmailChange(userId: string, newEmail: string): Promise<void> {
    try {
      // Invalidate Google Calendar tokens
      await supabase.functions.invoke('invalidate-google-calendar-tokens', {
        body: { 
          userId, 
          newEmail, 
          reason: 'email_change' 
        }
      });
    } catch (error) {
      console.error('Failed to invalidate Google Calendar tokens:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Private method: Sync auth with database
   */
  private async syncAuthWithDatabase(userId: string): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user || authUser.user.id !== userId) return;

    const authEmail = authUser.user.email;
    const authName = authUser.user.user_metadata?.name;
    
    // Get current database data
    const { data: dbProfile, error } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();
      
    if (error) return; // Silently fail for sync operation
    
    // Update database to match auth
    const updates: any = {};
    if (authEmail && authEmail !== dbProfile.email) {
      updates.email = authEmail;
    }
    if (authName && authName !== dbProfile.name) {
      updates.name = authName;
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();