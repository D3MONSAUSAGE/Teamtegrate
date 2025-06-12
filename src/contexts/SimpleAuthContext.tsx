
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { User as AppUser, UserRole } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean; // Add compatibility prop
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
  const [initialized, setInitialized] = useState(false);

  const createFallbackUser = (session: Session): AppUser => {
    const metadata = session.user.user_metadata || {};
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: metadata.name || session.user.email || 'User',
      role: (metadata.role as UserRole) || 'user',
      organizationId: metadata.organization_id || null,
      avatar_url: metadata.avatar_url || null,
      timezone: metadata.timezone || null,
      createdAt: new Date(session.user.created_at),
    };
  };

  const fetchUserProfile = async (userId: string, retries = 2): Promise<AppUser | null> => {
    try {
      console.log('🔍 Fetching user profile for:', userId, `(attempt ${3 - retries})`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        
        // Retry on certain errors
        if ((error.code === 'PGRST116' || error.message.includes('JWT')) && retries > 0) {
          console.log('🔄 Retrying profile fetch after delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await fetchUserProfile(userId, retries - 1);
        }
        
        return null;
      }

      if (!data) {
        console.error('❌ No user data returned from database');
        return null;
      }

      console.log('✅ User profile fetched successfully:', {
        id: data.id,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id
      });

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
      
      if (retries > 0) {
        console.log('🔄 Retrying profile fetch due to exception...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await fetchUserProfile(userId, retries - 1);
      }
      
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
      
      if (newSession?.user) {
        setSession(newSession);
        
        // Try to fetch profile, but use fallback if it fails
        const userProfile = await fetchUserProfile(newSession.user.id);
        setUser(userProfile || createFallbackUser(newSession));
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
        toast.error(error.message);
        throw error;
      }

      if (data.session) {
        console.log('✅ Login successful - session created');
        // Session state will be updated by the auth state listener
        toast.success('Welcome back!');
      } else {
        console.error('❌ Login succeeded but no session returned');
        throw new Error('No session returned from login');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
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
        toast.error(error.message);
        throw error;
      }

      console.log('✅ Signup successful');
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Attempting logout');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        toast.error('Error signing out');
        throw error;
      }

      console.log('✅ Logout successful');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        
        if (session?.user && isMounted) {
          console.log('✅ Found existing session');
          setSession(session);
          
          // Try to fetch profile, but use fallback if it fails
          const userProfile = await fetchUserProfile(session.user.id);
          if (isMounted) {
            setUser(userProfile || createFallbackUser(session));
          }
        }
        
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ Error in initializeAuth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || !initialized) return;

        console.log('🔄 Auth state change:', event, !!session);

        if (session?.user) {
          setSession(session);
          
          // Try to fetch the full user profile from database
          const userProfile = await fetchUserProfile(session.user.id);
          
          if (isMounted) {
            // Always set a user - either from database or fallback
            setUser(userProfile || createFallbackUser(session));
          }
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );

    // Initialize
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Authentication status is now properly based on both session and user
  const isAuthenticated = !!session && !!user && initialized;

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
