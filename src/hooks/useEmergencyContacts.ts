import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EmergencyContact {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmergencyContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (fetchError) throw fetchError;

      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      setError('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contactData: Omit<EmergencyContact, 'id' | 'user_id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id || !user?.organizationId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          ...contactData,
          user_id: user.id,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Emergency contact added successfully",
      });

      return data;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to add emergency contact",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: string, updates: Partial<EmergencyContact>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...data } : contact
      ));

      toast({
        title: "Success",
        description: "Emergency contact updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to update emergency contact",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryContact = async (id: string) => {
    try {
      setLoading(true);

      // First, unset all other primary contacts
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Then set the selected contact as primary
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;

      await fetchContacts(); // Refresh the list
      toast({
        title: "Success",
        description: "Primary emergency contact updated",
      });
    } catch (error) {
      console.error('Error setting primary contact:', error);
      toast({
        title: "Error",
        description: "Failed to update primary contact",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user?.id]);

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    refetch: fetchContacts,
  };
};