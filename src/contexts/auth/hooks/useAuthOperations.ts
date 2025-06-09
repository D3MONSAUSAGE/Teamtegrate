
import { useState } from 'react';
import { login as authLogin, signup as authSignup, logout as authLogout, updateUserProfile as updateProfile } from '../authOperations';
import { User, Session } from '@supabase/supabase-js';

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
      await authLogin(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: any) => {
    setLoading(true);
    try {
      await authSignup(email, password, name, role);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout(!!session);
      setSession(null);
      setUser(null);
    } catch (error) {
      // Still clear local state even if logout fails
      setSession(null);
      setUser(null);
      throw error;
    }
  };
  
  const updateUserProfile = async (data: { name?: string }) => {
    try {
      await updateProfile(data);
      
      if (user) {
        setUser({
          ...user,
          name: data.name || user.name,
        });
      }
    } catch (error) {
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
