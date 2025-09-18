
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

export const login = async (email: string, password: string) => {
  try {
    console.log('Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    console.log('Login successful for:', email);
    return data;
  } catch (error) {
    console.error('Login failed:', error);
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

export const updateUserProfile = async (data: { name?: string; email?: string }) => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('No authenticated user');

    const originalEmail = currentUser.user.email;
    const isEmailChange = data.email && data.email !== originalEmail;
    let authUpdateSucceeded = false;
    let dbUpdateSucceeded = false;

    // Step 1: Update auth user (this triggers email confirmation flow)
    const updateData: any = {};
    
    if (data.name) {
      updateData.data = { name: data.name };
    }
    
    if (isEmailChange) {
      updateData.email = data.email;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.auth.updateUser(updateData);

      if (error) {
        console.error('Profile update error:', error);
        toast.error(`Failed to update profile: ${error.message}`);
        throw error;
      }
      authUpdateSucceeded = true;
      
      if (isEmailChange) {
        toast.info('Email confirmation sent. Please check your new email to confirm the change.');
      }
    }

    // Step 2: Update database table with retry logic
    const updateFields: any = {};
    if (data.name) updateFields.name = data.name;
    
    // For email changes, we'll only update the database after confirmation
    // But we'll update the name immediately if provided
    if (data.name && Object.keys(updateFields).length > 0) {
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !dbUpdateSucceeded) {
        try {
          const { error: dbError } = await supabase
            .from('users')
            .update(updateFields)
            .eq('id', currentUser.user.id);

          if (dbError) {
            console.error(`Database update attempt ${retryCount + 1} failed:`, dbError);
            retryCount++;
            
            if (retryCount >= maxRetries) {
              toast.error('Database update failed after retries. Your changes may not be fully saved.');
              console.error('Final database update error:', dbError);
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          } else {
            dbUpdateSucceeded = true;
            console.log('✅ Database update successful');
          }
        } catch (err) {
          console.error(`Database update attempt ${retryCount + 1} exception:`, err);
          retryCount++;
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
    }

    // Step 3: Invalidate Google Calendar tokens when email changes
    if (isEmailChange) {
      try {
        const { data: invalidateResult, error: invalidateError } = await supabase.functions.invoke('invalidate-google-calendar-tokens', {
          body: { 
            userId: currentUser.user.id, 
            newEmail: data.email, 
            reason: 'email_change' 
          }
        });

        if (invalidateError) {
          console.error('⚠️ Failed to invalidate Google Calendar tokens:', invalidateError);
        } else {
          console.log('✅ Google Calendar tokens invalidated due to email change');
        }
      } catch (tokenError) {
        console.error('⚠️ Error calling token invalidation function:', tokenError);
      }
    }

    // Success message
    if (isEmailChange) {
      toast.success('Profile update initiated. Please confirm your new email to complete the process.');
    } else {
      toast.success('Profile updated successfully');
    }

  } catch (error) {
    console.error('Profile update failed:', error);
    throw error;
  }
};

// New function to manually sync profile data between auth and database
export const syncProfileData = async () => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('No authenticated user');

    console.log('🔄 Syncing profile data...');
    
    // Get current auth user data
    const authEmail = currentUser.user.email;
    const authName = currentUser.user.user_metadata?.name;
    
    // Get current database data
    const { data: dbProfile, error: fetchError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', currentUser.user.id)
      .single();
      
    if (fetchError) {
      console.error('Failed to fetch current profile:', fetchError);
      throw fetchError;
    }
    
    console.log('Auth data:', { email: authEmail, name: authName });
    console.log('DB data:', { email: dbProfile.email, name: dbProfile.name });
    
    // Update database to match auth
    const updates: any = {};
    if (authEmail && authEmail !== dbProfile.email) {
      updates.email = authEmail;
    }
    if (authName && authName !== dbProfile.name) {
      updates.name = authName;
    }
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.user.id);
        
      if (updateError) {
        console.error('Failed to sync profile:', updateError);
        throw updateError;
      }
      
      console.log('✅ Profile synced successfully:', updates);
      toast.success('Profile data synced successfully');
    } else {
      toast.info('Profile data is already in sync');
    }
    
  } catch (error) {
    console.error('Profile sync failed:', error);
    toast.error('Failed to sync profile data');
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
      console.error('Error generating enhanced invite code:', error);
      return { success: false, error: 'Failed to generate invite code' };
    }

    return { success: true, inviteCode: data };
  } catch (error) {
    console.error('Error in generateEnhancedInviteCode:', error);
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
