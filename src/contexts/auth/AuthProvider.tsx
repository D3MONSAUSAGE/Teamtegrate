
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
  organization_id?: string;
  avatar_url?: string;
  timezone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider: Initializing');

  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      console.log('AuthProvider: Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        return null;
      }

      console.log('AuthProvider: User profile fetched:', data);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        organizationId: data.organization_id,
        organization_id: data.organization_id,
        avatar_url: data.avatar_url,
        timezone: data.timezone,
      };
    } catch (error) {
      console.error('AuthProvider: Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    console.log('AuthProvider: Refreshing user');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id);
      setUser(userProfile);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('AuthProvider: Initial session:', !!session);
        setSession(session);

        if (session?.user) {
          console.log('AuthProvider: User found in session:', session.user.id);
          const userProfile = await fetchUserProfile(session.user.id);
          setUser(userProfile);
        } else {
          console.log('AuthProvider: No user in session');
          setUser(null);
        }
      } catch (error) {
        console.error('AuthProvider: Error in initializeAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, !!session);
        
        setSession(session);
        
        if (session?.user) {
          console.log('AuthProvider: User authenticated:', session.user.id);
          const userProfile = await fetchUserProfile(session.user.id);
          setUser(userProfile);
        } else {
          console.log('AuthProvider: User signed out');
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: Error signing out:', error);
        throw error;
      }
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('AuthProvider: Error in signOut:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user && !!session;

  console.log('AuthProvider: Current state - loading:', loading, 'user:', !!user, 'isAuthenticated:', isAuthenticated);

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
