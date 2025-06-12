
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { User as AppUser, UserRole } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole, organizationData?: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRoleAccess: (requiredRole: UserRole) => boolean;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      console.log('🔍 Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.error('❌ No user data returned from database');
        return null;
      }

      console.log('✅ User profile fetched successfully');

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        organizationId: data.organization_id,
        avatar_url: data.avatar_url,
        timezone: data.timezone,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      return null;
    }
  };

  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'superadmin': 4
    };
    
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing user session...');
      
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Error refreshing session:', error);
        return;
      }
      
      setSession(newSession);
      
      if (newSession?.user) {
        const userProfile = await fetchUserProfile(newSession.user.id);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      
      console.log('✅ Session refresh complete');
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw error;
      }

      console.log('✅ Login successful');
      toast.success('Welcome back!');
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    organizationData?: any
  ) => {
    try {
      console.log('📝 Attempting signup for:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const metadata: Record<string, any> = {
        name,
        role,
      };

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
        console.error('❌ Signup error:', error);
        throw error;
      }

      console.log('✅ Signup successful');
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('❌ Signup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Attempting logout');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        throw error;
      }

      console.log('✅ Logout successful');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      toast.error('Error signing out');
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setSession(session);
          
          if (session?.user) {
            console.log('✅ Found existing session');
            // Fetch user profile separately - don't block on it
            fetchUserProfile(session.user.id).then((userProfile) => {
              if (isMounted) {
                setUser(userProfile);
              }
            });
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error in initializeAuth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('🔄 Auth state change:', event, !!session);

        setSession(session);
        
        if (session?.user) {
          // Fetch user profile after session is set
          fetchUserProfile(session.user.id).then((userProfile) => {
            if (isMounted) {
              setUser(userProfile);
            }
          });
        } else {
          setUser(null);
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Authentication is based on session only - don't wait for user profile
  const isAuthenticated = !!session;

  const value: AuthContextType = {
    user,
    session,
    loading,
    isLoading: loading,
    login,
    signup,
    logout,
    isAuthenticated,
    hasRoleAccess,
    refreshUserSession,
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
