
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';
import { userManagementService } from '@/services/userManagementService';

export const login = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  organizationData?: {
    type: 'create' | 'join';
    organizationName?: string;
    inviteCode?: string;
  }
) => {
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const metadata: Record<string, any> = {
      name,
      role,
    };

    // Add organization data to metadata
    if (organizationData?.type === 'create' && organizationData.organizationName) {
      metadata.organizationName = organizationData.organizationName;
      metadata.organizationType = 'create';
    } else if (organizationData?.type === 'join' && organizationData.inviteCode) {
      metadata.invite_code = organizationData.inviteCode;
      metadata.organizationType = 'join';
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Account created successfully!');
    return data;
  } catch (error) {
    throw error;
  }
};

export const logout = async (hasSession: boolean) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error('Error signing out');
      throw error;
    }

    toast.success('Signed out successfully');
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (data: { name?: string; email?: string }) => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('No authenticated user');

    // Use the centralized user management service
    await userManagementService.updateUserProfile(currentUser.user.id, data);
  } catch (error) {
    throw error;
  }
};

// New function to manually sync profile data between auth and database
export const syncProfileData = async () => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('No authenticated user');
    
    // Use the centralized user management service
    await userManagementService.syncUserData(currentUser.user.id);
  } catch (error) {
    throw error;
  }
};

export const generateInviteCode = async (
  organizationId: string, 
  expiryDays: number = 7, 
  maxUses?: number
): Promise<{ success: boolean; inviteCode?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('generate_invite_code', {
      org_id: organizationId,
      created_by_id: (await supabase.auth.getUser()).data.user?.id,
      expires_days: expiryDays,
      max_uses_param: maxUses || null
    });

    if (error) {
      return { success: false, error: 'Failed to generate invite code' };
    }

    return { success: true, inviteCode: data };
  } catch (error) {
    return { success: false, error: 'Failed to generate invite code' };
  }
};

// Enhanced function to generate invite code with role and team
export const generateEnhancedInviteCode = async (
  organizationId: string,
  role: UserRole,
  teamId?: string,
  expiryDays: number = 7,
  maxUses?: number
): Promise<{ success: boolean; inviteCode?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('generate_invite_code_with_role', {
      org_id: organizationId,
      created_by_id: (await supabase.auth.getUser()).data.user?.id,
      invited_role: role,
      invited_team_id: teamId || null,
      expires_days: expiryDays,
      max_uses_param: maxUses || null
    });

    if (error) {
      return { success: false, error: 'Failed to generate invite code' };
    }

    return { success: true, inviteCode: data };
  } catch (error) {
    return { success: false, error: 'Failed to generate invite code' };
  }
};

// Updated function to use non-consuming validation for frontend checks
export const validateInviteCode = async (
  inviteCode: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Use the new non-consuming validation function for frontend checks
    const { data, error } = await supabase.rpc('validate_invite_code_without_consuming', {
      code: inviteCode
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      return data as { success: boolean; error?: string };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to validate invite code' };
  }
};
