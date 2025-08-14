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
    if (!user) return;
    
    try {
      setError(null);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('organization_id', user.organizationId)
        .order('name');

      if (error) throw error;
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
    fetchUsers();
  }, [user]);

  return { 
    users, 
    loading,
    isLoading: loading, // Provide both property names for compatibility
    error, 
    fetchUsers, 
    updateUserRole 
  };
};