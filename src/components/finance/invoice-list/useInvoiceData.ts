import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import type { Invoice } from '@/types/invoice';

export const useInvoiceData = (refreshTrigger: number) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(id, name, contact_email),
          expense_category:expense_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load invoices');
        return;
      }

      setInvoices((data || []) as Invoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  return {
    invoices,
    isLoading,
    refetchInvoices: fetchInvoices
  };
};
