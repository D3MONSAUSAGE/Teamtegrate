import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceClient } from '@/types/invoices';

export const useInvoiceClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user?.organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('invoice_clients')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (clientData: Omit<InvoiceClient, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user?.organizationId || !user?.id) {
      throw new Error('User must be authenticated and have an organization');
    }

    try {
      const { data, error } = await supabase
        .from('invoice_clients')
        .insert({
          ...clientData,
          organization_id: user.organizationId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      setClients(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating client:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user?.organizationId]);

  return {
    clients,
    isLoading,
    error,
    refetch: fetchClients,
    createClient
  };
};