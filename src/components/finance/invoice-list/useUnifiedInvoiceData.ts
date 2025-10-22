import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';

export const useUnifiedInvoiceData = (refreshTrigger: number) => {
  const [invoices, setInvoices] = useState<UnifiedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      // Fetch uploaded invoices
      const { data: uploadedData, error: uploadedError } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(id, name, contact_email),
          expense_category:expense_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (uploadedError) throw uploadedError;

      // Fetch created invoices with payment records count
      const { data: createdData, error: createdError } = await supabase
        .from('created_invoices')
        .select(`
          *,
          client:invoice_clients(id, name, email),
          warehouse:warehouses(id, name),
          line_items:invoice_line_items(id),
          payment_records:payment_records(id, amount, payment_date)
        `)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      // Transform uploaded invoices
      const transformedUploaded: UnifiedInvoice[] = (uploadedData || []).map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        source: 'uploaded' as const,
        organization_id: inv.organization_id,
        team_id: inv.team_id,
        created_at: inv.created_at,
        total_amount: inv.invoice_total || 0,
        paid_amount: inv.paid_amount || 0,
        balance_due: (inv.invoice_total || 0) - (inv.paid_amount || 0),
        currency: inv.currency || 'USD',
        payment_status: (inv.payment_status as any) || 'unpaid',
        payment_due_date: inv.payment_due_date,
        has_payments: (inv.paid_amount || 0) > 0,
        payment_count: 0,
        uploaded_data: {
          branch: inv.branch,
          uploader_name: inv.uploader_name,
          user_id: inv.user_id,
          file_name: inv.file_name,
          file_type: inv.file_type,
          file_path: inv.file_path,
          file_size: inv.file_size,
          vendor: inv.vendor,
          expense_category: inv.expense_category,
          payment_method: inv.payment_method,
          reference_number: inv.reference_number,
          notes: inv.notes,
          tags: inv.tags
        }
      }));

      // Transform created invoices
      const transformedCreated: UnifiedInvoice[] = (createdData || []).map(inv => {
        const paymentRecords = inv.payment_records || [];
        const lineItems = inv.line_items || [];
        const lastPayment = paymentRecords.sort((a, b) => 
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        )[0];

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_date: inv.issue_date,
          source: 'created' as const,
          organization_id: inv.organization_id,
          team_id: inv.team_id,
          created_at: inv.created_at,
          total_amount: inv.total_amount,
          paid_amount: inv.paid_amount,
          balance_due: inv.balance_due,
          currency: 'USD',
          payment_status: inv.payment_status as any,
          payment_due_date: inv.due_date,
          has_payments: paymentRecords.length > 0,
          payment_count: paymentRecords.length,
          last_payment_date: lastPayment?.payment_date,
          created_data: {
            creation_method: inv.warehouse_id ? 'warehouse_checkout' : 'manual',
            warehouse_id: inv.warehouse_id,
            warehouse_name: inv.warehouse?.name,
            client_id: inv.client_id,
            client_name: inv.client?.name || 'Unknown Client',
            client_email: inv.client?.email,
            status: inv.status as any,
            issue_date: inv.issue_date,
            subtotal: inv.subtotal,
            tax_amount: inv.tax_amount,
            line_items_count: lineItems.length,
            payment_terms: inv.payment_terms,
            sent_at: inv.sent_at,
            paid_at: inv.paid_at,
            notes: inv.notes
          }
        };
      });

      // Merge and sort by date (most recent first)
      const merged = [...transformedUploaded, ...transformedCreated].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setInvoices(merged);
    } catch (error) {
      console.error('Error fetching unified invoices:', error);
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
