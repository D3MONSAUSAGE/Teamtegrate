
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  branch: string;
  team_id?: string;
  uploader_name: string;
  invoice_date: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
  
  // Financial tracking fields
  vendor_id?: string;
  invoice_total?: number;
  currency?: string;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'void';
  payment_due_date?: string;
  paid_amount?: number;
  expense_category_id?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  tags?: string[];
  
  // Joined data
  vendor?: {
    id: string;
    name: string;
    contact_email?: string;
  };
  expense_category?: {
    id: string;
    name: string;
  };
}

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
