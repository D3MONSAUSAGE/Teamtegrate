
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (data: { name?: string }) => Promise<void>;
  hasRoleAccess: (requiredRole: UserRole) => boolean;
  canManageUser: (targetRole: UserRole) => boolean;
  refreshUserSession: () => Promise<void>;
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

  const ROLE_HIERARCHY: Record<UserRole, number> = {
    'superadmin': 4,
    'admin': 3,
    'manager': 2,
    'user': 1
  };

  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const canManageUser = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] > ROLE_HIERARCHY[targetRole as UserRole];
  };

  const createUserFromSession = async (session: Session): Promise<User> => {
    try {
      // First try to get the most up-to-date role from the database
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const dbRole = dbUser?.role as UserRole;
      const metaRole = session.user.user_metadata.role as UserRole;
      
      // Use database role if available, otherwise fall back to metadata
      const currentRole = dbRole || metaRole || 'user';

      // If the roles don't match, update the auth metadata
      if (dbRole && dbRole !== metaRole) {
        console.log(`Role mismatch detected. DB: ${dbRole}, Meta: ${metaRole}. Updating metadata.`);
        try {
          await supabase.auth.updateUser({
            data: { role: dbRole }
          });
        } catch (error) {
          console.warn('Failed to update user metadata:', error);
        }
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
        role: currentRole,
        createdAt: new Date(session.user.created_at),
      };
    } catch (error) {
      console.error('Error creating user from session:', error);
      // Return basic user info if database call fails
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
        role: (session.user.user_metadata.role as UserRole) || 'user',
        createdAt: new Date(session.user.created_at),
      };
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }

      if (newSession) {
        const userData = await createUserFromSession(newSession);
        setSession(newSession);
        setUser(userData);
        console.log('Session refreshed successfully, updated role:', userData.role);
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  };

  // Check if user is logged in on mount and set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        try {
          setSession(session);
          if (session?.user) {
            const userData = await createUserFromSession(session);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
        } finally {
          // Always clear loading state after handling auth state change
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        if (session?.user) {
          const userData = await createUserFromSession(session);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          },
          emailRedirectTo: window.location.origin + '/dashboard',
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
      if (!session) {
        console.log('No active session found, clearing local state only');
        setUser(null);
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error('Error logging out. Your local session has been cleared.');
      setUser(null);
      setSession(null);
      throw error;
    }
  };
  
  const updateUserProfile = async (data: { name?: string }) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error('No active session found. Please log in again.');
      }

      const { error } = await supabase.auth.updateUser({
        data: data
      });

      if (error) throw error;
      
      if (user) {
        setUser({
          ...user,
          name: data.name || user.name,
        });
      }
      
      return;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isLoading: loading,
    login,
    signup,
    logout,
    updateUserProfile,
    isAuthenticated: !!user,
    hasRoleAccess,
    canManageUser,
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
