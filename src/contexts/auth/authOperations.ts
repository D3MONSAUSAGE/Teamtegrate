import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

export const login = async (email: string, password: string) => {
  try {
    console.log('🔑 AuthOps: Starting login for:', email);
    
    // Attempt login directly without clearing existing session
    console.log('🔑 AuthOps: Calling supabase.auth.signInWithPassword...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    console.log('🔑 AuthOps: signInWithPassword response:', {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      userId: data?.user?.id,
      userEmail: data?.user?.email,
      error: error ? {
        message: error.message,
        status: error.status
      } : null
    });

    if (error) {
      console.error('❌ AuthOps: Login error:', error);
      throw error;
    }

    if (!data?.user || !data?.session) {
      console.error('❌ AuthOps: No user or session data returned');
      throw new Error('Login failed: No user data received');
    }

    console.log('✅ AuthOps: Login successful for:', email);
    toast.success('Successfully logged in!');
    return data;
    
  } catch (error) {
    console.error('❌ AuthOps: Login failed:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message?.includes('Too many requests')) {
        toast.error('Too many login attempts. Please wait and try again.');
      } else if (error.message?.includes('500')) {
        toast.error('Database connection issues. Please try again.');
      } else if (error.message?.includes('403')) {
        toast.error('Authentication service unavailable. Please try again.');
      }
    }
    
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
    console.log('Attempting signup for:', email, 'with role:', role);
    
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
      console.error('Signup error:', error);
      toast.error(error.message);
      throw error;
    }

    console.log('Signup successful for:', email);
    toast.success('Account created successfully!');
    return data;
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
};

export const logout = async (hasSession: boolean) => {
  try {
    console.log('Attempting logout, has session:', hasSession);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      toast.error('Error signing out');
      throw error;
    }

    console.log('Logout successful');
    toast.success('Signed out successfully');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

export const updateUserProfile = async (data: { name?: string }) => {
  try {
    const { error } = await supabase.auth.updateUser({
      data
    });

    if (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
      throw error;
    }

    // Also update the users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ name: data.name })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    if (dbError) {
      console.error('Database profile update error:', dbError);
      toast.error('Failed to update profile in database');
      throw dbError;
    }

    toast.success('Profile updated successfully');
  } catch (error) {
    console.error('Profile update failed:', error);
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
      console.error('Error generating invite code:', error);
      return { success: false, error: 'Failed to generate invite code' };
    }

    return { success: true, inviteCode: data };
  } catch (error) {
    console.error('Error in generateInviteCode:', error);
    return { success: false, error: 'Failed to generate invite code' };
  }
};

export const validateInviteCode = async (
  inviteCode: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('validate_and_use_invite_code', {
      code: inviteCode
    });

    if (error) {
      console.error('Error validating invite code:', error);
      return { success: false, error: error.message };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      return data as { success: boolean; error?: string };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in validateInviteCode:', error);
    return { success: false, error: 'Failed to validate invite code' };
  }
};
