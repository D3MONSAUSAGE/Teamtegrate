
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const createUserProfile = async (authUser: any, organizationId: string): Promise<User> => {
  const userData: User = {
    id: authUser.id,
    email: authUser.email,
    role: 'user' as UserRole,
    organizationId: organizationId, // Changed from organization_id
    name: authUser.user_metadata?.name || authUser.email,
    timezone: 'UTC',
    createdAt: new Date(),
    avatar_url: authUser.user_metadata?.avatar_url
  };

  // Insert into users table
  const { error } = await supabase
    .from('users')
    .insert({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      organization_id: userData.organizationId,
      name: userData.name,
      timezone: userData.timezone,
      avatar_url: userData.avatar_url
    });

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  return userData;
};

export const getUserRole = (user: any): UserRole => {
  return user?.role || 'user';
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    'user': 1,
    'manager': 2,
    'admin': 3,
    'superadmin': 4
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
