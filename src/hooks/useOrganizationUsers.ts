import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export const useOrganizationUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    // Check if user exists and has valid organizationId
    if (!user || !user.organizationId || user.organizationId.trim() === '') {
      console.log('useOrganizationUsers: No user or organizationId available', {
        hasUser: !!user,
        organizationId: user?.organizationId
      });
      setUsers([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('useOrganizationUsers: Fetching users for org:', user.organizationId);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('organization_id', user.organizationId)
        .order('name');

      if (error) throw error;
      
      console.log('useOrganizationUsers: Found users:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching organization users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('organization_id', user?.organizationId);

      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Only fetch when user and organizationId are properly loaded
    if (user && user.organizationId && user.organizationId.trim() !== '') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user?.organizationId, user?.id]);

  return { 
    users, 
    loading,
    isLoading: loading, // Provide both property names for compatibility
    error, 
    fetchUsers, 
    updateUserRole 
  };
};