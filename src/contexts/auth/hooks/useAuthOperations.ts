
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
    setLoading(true);
    try {
      console.log('AuthOperations: Starting login for:', email);
      await authLogin(email, password);
      console.log('AuthOperations: Login successful');
      // Don't set loading to false here - let the auth state change handle it
      // The onAuthStateChange listener will trigger updateSession which will handle the loading state
    } catch (error) {
      console.error('AuthOperations: Login failed:', error);
      setLoading(false); // Only set loading to false on error
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
    setLoading(true);
    try {
      console.log('AuthOperations: Starting signup for:', email, 'with role:', role);
      await authSignup(email, password, name, role, organizationData);
      console.log('AuthOperations: Signup successful');
    } catch (error) {
      console.error('AuthOperations: Signup failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthOperations: Starting logout, has session:', !!session);
      await authLogout(!!session);
      console.log('AuthOperations: Logout successful, clearing state');
      
      // Always clear state, even if logout API call fails
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('AuthOperations: Logout error (clearing state anyway):', error);
      // Still clear local state even if logout fails
      setSession(null);
      setUser(null);
      throw error;
    }
  };
  
  const updateUserProfile = async (data: { name?: string }) => {
    try {
      console.log('AuthOperations: Updating user profile:', data);
      await updateProfile(data);
      
      if (user) {
        console.log('AuthOperations: Updating local user state');
        setUser({
          ...user,
          name: data.name || user.name,
        });
      }
      console.log('AuthOperations: Profile update successful');
    } catch (error) {
      console.error('AuthOperations: Profile update failed:', error);
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
