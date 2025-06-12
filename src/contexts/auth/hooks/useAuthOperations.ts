
import { useState } from 'react';
import { login as authLogin, signup as authSignup, logout as authLogout, updateUserProfile as updateProfile } from '../authOperations';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';

export const useAuthOperations = (
  session: Session | null,
  user: User | null,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void
) => {
  const login = async (email: string, password: string) => {
    console.log('🔑 AuthOperations: Starting login process');
    
    try {
      await authLogin(email, password);
      console.log('✅ AuthOperations: Login successful, auth state will be updated by listener');
      // Auth state change will handle setting user/session via the listener
    } catch (error) {
      console.error('❌ AuthOperations: Login failed:', error);
      // Don't modify loading state on error - let caller handle it
      throw error;
    }
  };

  const signup = async (
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
    console.log('📝 AuthOperations: Starting signup process');
    
    try {
      await authSignup(email, password, name, role, organizationData);
      console.log('✅ AuthOperations: Signup successful, auth state will be updated by listener');
      // Auth state change will handle setting user/session via the listener
    } catch (error) {
      console.error('❌ AuthOperations: Signup failed:', error);
      // Don't modify loading state on error - let caller handle it
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 AuthOperations: Starting logout process');
      await authLogout(!!session);
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      console.log('✅ AuthOperations: Logout successful');
    } catch (error) {
      console.error('❌ AuthOperations: Logout failed:', error);
      // Still clear local state even if logout fails
      setSession(null);
      setUser(null);
      throw error;
    }
  };
  
  const updateUserProfile = async (data: { name?: string }) => {
    try {
      console.log('🔄 AuthOperations: Updating user profile');
      await updateProfile(data);
      
      if (user) {
        setUser({
          ...user,
          name: data.name || user.name,
        });
      }
      console.log('✅ AuthOperations: Profile updated successfully');
    } catch (error) {
      console.error('❌ AuthOperations: Profile update failed:', error);
      throw error;
    }
  };

  return {
    login,
    signup,
    logout,
    updateUserProfile
  };
};
