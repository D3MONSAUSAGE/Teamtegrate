
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
  const [authInitialized, setAuthInitialized] = useState(false);

  console.log('AuthProvider: Current State', { 
    user, 
    loading, 
    isAuthenticated: !!user, 
    authInitialized 
  });

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    let authStateSubscription: { unsubscribe: () => void } | null = null;
    
    const setupAuth = async () => {
      try {
        // First set up the auth state change listener
        const { data } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('AuthProvider: Auth State Changed', { event, newSession: !!newSession });
            
            setSession(newSession);
            
            if (newSession?.user) {
              try {
                const { data: userData, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', newSession.user.id)
                  .maybeSingle();

                console.log('AuthProvider: User Data Fetch', { userData, error });

                if (error) {
                  console.error('Error fetching user data:', error);
                  setUser(null);
                  setLoading(false);
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
                  // User exists in auth but not in users table
                  console.warn('User exists in auth but not in users table');
                  setUser(null);
                }
              } catch (error) {
                console.error('Error in auth state change handler:', error);
                setUser(null);
              } finally {
                setLoading(false);
              }
            } else {
              setUser(null);
              setLoading(false);
            }
          }
        );
        
        authStateSubscription = data.subscription;
        
        // Then check for an existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        console.log('AuthProvider: Initial Session Check', { session: !!sessionData.session });
        
        if (sessionData.session?.user) {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', sessionData.session.user.id)
              .maybeSingle();

            console.log('AuthProvider: Initial User Data Fetch', { userData, error });

            if (error) {
              console.error('Error fetching user data:', error);
              setLoading(false);
              setAuthInitialized(true);
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
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
        
        setLoading(false);
        setAuthInitialized(true);
      } catch (error) {
        console.error('Error in auth setup:', error);
        setLoading(false);
        setAuthInitialized(true);
      }
    };
    
    setupAuth();
    
    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('AuthProvider: Login Attempt', { email });
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('AuthProvider: Login Result', { data: !!data, error });

      if (error) throw error;
      
      toast.success('Logged in successfully!');
      return;
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });

      console.log('AuthProvider: Signup Result', { data: !!data, error });

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
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('AuthProvider: Error logging out:', error);
      toast.error('Error logging out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading: loading || !authInitialized,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
