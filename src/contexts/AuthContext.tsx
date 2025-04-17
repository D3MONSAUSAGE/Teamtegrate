
import React, { createContext, useState, useContext, useEffect } from 'react';
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

  console.log('AuthProvider Initial State', { user, loading });

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth State Changed', { event, session });
        setSession(session);
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          console.log('AuthProvider: User Data Fetch', { userData, error });

          if (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
            return;
          }

          if (userData) {
            const user: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role as UserRole,
              createdAt: new Date(userData.created_at),
            };
            setUser(user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthProvider: Initial Session Check', { session });
      setSession(session);
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('AuthProvider: Initial User Data Fetch', { userData, error });

        if (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          return;
        }

        if (userData) {
          const user: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as UserRole,
            createdAt: new Date(userData.created_at),
          };
          setUser(user);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('AuthProvider: Login Attempt', { email });
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('AuthProvider: Login Result', { error });

      if (error) throw error;

    } catch (error: any) {
      console.error('AuthProvider: Error logging in:', error);
      toast.error(error.message || 'Error logging in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    console.log('AuthProvider: Signup Attempt', { email, name, role });
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

      console.log('AuthProvider: Signup Result', { error });

      if (error) throw error;
      
      toast.success('Account created successfully! Please check your email for verification.');

    } catch (error: any) {
      console.error('AuthProvider: Error signing up:', error);
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
      console.error('AuthProvider: Error logging out:', error);
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
