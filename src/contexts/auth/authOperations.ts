import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

export const login = async (email: string, password: string) => {
  try {
    console.log('🔑 AuthOps: Starting login attempt for:', email);
    
    // Check current session before login
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    console.log('🔑 AuthOps: Current session before login:', {
      hasSession: !!currentSession,
      sessionUserId: currentSession?.user?.id,
      sessionValid: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) > new Date() : false
    });

    // If already logged in as the same user, don't attempt new login
    if (currentSession?.user?.email === email.trim().toLowerCase()) {
      console.log('✅ AuthOps: User already logged in with same email, returning existing session');
      toast.success('Already logged in!');
      return { user: currentSession.user, session: currentSession };
    }

    // Clear any existing session first to prevent conflicts
    if (currentSession) {
      console.log('🧹 AuthOps: Clearing existing session before new login');
      await supabase.auth.signOut();
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Attempt login with enhanced error handling
    console.log('🔑 AuthOps: Calling supabase.auth.signInWithPassword...');
    
    const loginPromise = supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login request timed out after 20 seconds')), 20000)
    );
    
    const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

    console.log('🔑 AuthOps: signInWithPassword response:', {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      userId: data?.user?.id,
      userEmail: data?.user?.email,
      sessionAccessToken: data?.session?.access_token ? 'present' : 'missing',
      sessionExpiresAt: data?.session?.expires_at,
      error: error ? {
        message: error.message,
        status: error.status,
        details: error
      } : null
    });

    if (error) {
      console.error('❌ AuthOps: Login error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      });
      
      // Provide specific error messages based on error type
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please confirm your email address before logging in.');
      } else if (error.message?.includes('Too many requests')) {
        toast.error('Too many login attempts. Please wait a few minutes and try again.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('timeout')) {
        toast.error('Login request timed out. Please try again.');
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
      throw error;
    }

    if (!data?.user) {
      console.error('❌ AuthOps: No user data returned after login');
      toast.error('Login failed: No user data received');
      throw new Error('No user data returned');
    }

    if (!data?.session) {
      console.error('❌ AuthOps: No session data returned after login');
      toast.error('Login failed: No session data received');
      throw new Error('No session data returned');
    }

    // Verify session is valid
    const sessionValid = data.session.expires_at ? new Date(data.session.expires_at * 1000) > new Date() : false;
    console.log('✅ AuthOps: Session validation:', {
      expiresAt: data.session.expires_at,
      expiresAtDate: data.session.expires_at ? new Date(data.session.expires_at * 1000) : null,
      currentDate: new Date(),
      isValid: sessionValid
    });

    if (!sessionValid) {
      console.error('❌ AuthOps: Session is already expired');
      toast.error('Login failed: Session expired immediately');
      throw new Error('Session expired immediately');
    }

    // Wait a moment for the session to be properly stored
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test session persistence immediately after login
    console.log('🧪 AuthOps: Testing session persistence...');
    const { data: { session: persistedSession } } = await supabase.auth.getSession();
    console.log('🧪 AuthOps: Session persistence test:', {
      sessionPersisted: !!persistedSession,
      sessionMatches: persistedSession?.access_token === data.session.access_token
    });

    if (!persistedSession || persistedSession.access_token !== data.session.access_token) {
      console.error('❌ AuthOps: Session was not properly persisted');
      toast.error('Login failed: Session could not be saved');
      throw new Error('Session persistence failed');
    }

    console.log('✅ AuthOps: Login successful for:', email);
    console.log('✅ AuthOps: User data:', {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at,
      lastSignIn: data.user.last_sign_in_at,
      metadata: data.user.user_metadata
    });
    
    toast.success('Successfully logged in!');
    return data;
    
  } catch (error) {
    console.error('❌ AuthOps: Login failed with error:', error);
    
    if (error instanceof Error) {
      console.error('❌ AuthOps: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('timeout')) {
        toast.error('Login request timed out. Please try again.');
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
