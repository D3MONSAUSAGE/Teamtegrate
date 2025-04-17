
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile data including role from the profiles table
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      console.log('Profile data received:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
      return null;
    }
  };

  // Update user with profile data
  const updateUserWithProfile = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      console.log('No session user provided');
      return null;
    }
    
    const profile = await loadUserProfile(sessionUser.id);
    console.log('Loaded profile for user update:', profile);
    
    const userData: User = {
      id: sessionUser.id,
      email: sessionUser.email || '',
      name: profile?.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || '',
      role: (profile?.role as UserRole) || sessionUser.user_metadata?.role as UserRole || 'user',
      createdAt: new Date(sessionUser.created_at),
    };
    
    console.log('Setting user data:', userData);
    setUser(userData);
    return userData;
  }, []);

  // Check for profile updates periodically when user is logged in
  useEffect(() => {
    if (!session?.user) return;
    
    const checkProfileUpdates = async () => {
      await updateUserWithProfile(session.user);
    };
    
    // Initial check
    checkProfileUpdates();
    
    // Set up periodic checks
    const interval = setInterval(checkProfileUpdates, 10000);
    
    return () => clearInterval(interval);
  }, [session, updateUserWithProfile]);

  // Check if user is logged in on mount and set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        if (session?.user) {
          await updateUserWithProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Getting existing session:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        await updateUserWithProfile(session.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateUserWithProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

    } catch (error: any) {
      console.error('Error logging in:', error);
      toast.error(error.message || 'Error logging in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });

      if (error) throw error;
      
      toast.success('Account created successfully! Please check your email for verification.');

    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Error creating account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
