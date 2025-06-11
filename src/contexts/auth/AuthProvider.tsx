
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createUserProfile } from './utils/authHelpers';
import { User } from '@/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractUserDataFromSession } from './userSessionUtils';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string) => Promise<void>;
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadSession = async () => {
      const currentSession = supabase.auth.getSession();
      setSession((await currentSession).data.session);
      
      const userData = (await currentSession).data.session
        ? await extractUserDataFromSession((await currentSession).data.session!)
        : null;
      setUser(userData);
      setLoading(false);
    };

    loadSession();

    supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);

      if (currentSession) {
        const userData = await extractUserDataFromSession(currentSession);
        setUser(userData);
      } else {
        setUser(null);
      }

      if (event === 'SIGNED_IN') {
        const intendedRoute = localStorage.getItem('intendedRoute') || '/dashboard';
        localStorage.removeItem('intendedRoute');
        navigate(intendedRoute, { replace: true });
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  const createOrganizationForUser = async (authUser: any): Promise<string> => {
    const organizationId = crypto.randomUUID();

    // Insert into organizations table
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: organizationId,
        name: `${authUser.email}'s Organization`,
        created_by: authUser.id,
        created_at: new Date().toISOString()
      });

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Create user profile
    try {
      await createUserProfile(authUser, organizationId);
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return organizationId;
  };

  const signIn = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success(`Check your email (${email}) for the magic link to sign in.`);
    } catch (err: any) {
      console.error("Error signing in:", err);
      toast.error(`Failed to sign in: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error("Error signing out:", err);
      toast.error(`Failed to sign out: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        const userData = await extractUserDataFromSession(data.session);
        setUser(userData);
        setSession(data.session);
      }
    } catch (err: any) {
      console.error("Error refreshing session:", err);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signIn,
    signOut,
    logout: signOut,
    signup: signIn,
    refreshUserSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
