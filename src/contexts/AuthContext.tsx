
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { Organization, UserMetadata } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  userRole: UserRole | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (data: { name?: string }) => Promise<void>;
  hasPermission: (action: 'view' | 'upload' | 'download' | 'delete', resourceOwnerId?: string) => boolean;
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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount and set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const metadata = session.user.user_metadata as UserMetadata;
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: metadata?.name || session.user.email?.split('@')[0] || '',
            role: metadata?.role as UserRole || 'team_member',
            createdAt: new Date(session.user.created_at),
          };
          setUser(userData);
          setUserRole(metadata?.role as UserRole || 'team_member');
          
          // Fetch organization data if organization_id exists
          if (metadata?.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', metadata.organization_id)
              .single();
            
            if (orgData) {
              setOrganization(orgData);
            }
          }
        } else {
          setUser(null);
          setOrganization(null);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const metadata = session.user.user_metadata as UserMetadata;
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: metadata?.name || session.user.email?.split('@')[0] || '',
          role: metadata?.role as UserRole || 'team_member',
          createdAt: new Date(session.user.created_at),
        };
        setUser(userData);
        setUserRole(metadata?.role as UserRole || 'team_member');
        
        // Fetch organization data if organization_id exists
        if (metadata?.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', metadata.organization_id)
            .single();
          
          if (orgData) {
            setOrganization(orgData);
          }
        }
      }
      setLoading(false);
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

  const signup = async (email: string, password: string, name: string, organizationName: string) => {
    setLoading(true);
    try {
      // First create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          created_by: null, // Will be updated after user creation
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Sign up the user with organization metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            organization_id: orgData.id,
            role: 'admin',
          },
          emailRedirectTo: window.location.origin + '/dashboard',
        }
      });

      if (authError) throw authError;

      // Update organization with the created_by field
      if (authData.user) {
        await supabase
          .from('organizations')
          .update({ created_by: authData.user.id })
          .eq('id', orgData.id);
      }
      
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
        setOrganization(null);
        setUserRole(null);
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setOrganization(null);
      setUserRole(null);
      
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error('Error logging out. Your local session has been cleared.');
      setUser(null);
      setSession(null);
      setOrganization(null);
      setUserRole(null);
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

  const hasPermission = (action: 'view' | 'upload' | 'download' | 'delete', resourceOwnerId?: string): boolean => {
    if (!userRole) return false;

    switch (action) {
      case 'view':
      case 'download':
        return true; // All roles can view and download within their organization

      case 'upload':
        return userRole === 'admin' || userRole === 'manager';

      case 'delete':
        if (userRole === 'admin') return true;
        if (userRole === 'manager' && resourceOwnerId && user?.id === resourceOwnerId) return true;
        return false;

      default:
        return false;
    }
  };

  const value = {
    user,
    organization,
    userRole,
    loading,
    isLoading: loading,
    login,
    signup,
    logout,
    updateUserProfile,
    isAuthenticated: !!user,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
