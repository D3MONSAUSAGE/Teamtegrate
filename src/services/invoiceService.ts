import { supabase } from '@/integrations/supabase/client';
import { InvoiceClient, CreatedInvoice, InvoiceLineItem } from '@/types/invoices';

export interface CreateInvoiceData {
  client: InvoiceClient;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes?: string;
  footer_text?: string;
  payment_terms?: string;
  tax_rate?: number;
  transaction_reference?: string; // Link to inventory transaction
  team_id?: string; // Team that created the invoice
}

export const invoiceService = {
  async createInvoice(data: CreateInvoiceData): Promise<CreatedInvoice> {
    const { client, lineItems, notes, footer_text, payment_terms, tax_rate = 0, transaction_reference, team_id } = data;

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax_amount = subtotal * (tax_rate / 100);
    const total_amount = subtotal + tax_amount;

    // Generate invoice number
    const invoice_number = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const issue_date = new Date().toISOString().split('T')[0];
    const due_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

    try {
      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('created_invoices')
        .insert({
          organization_id: client.organization_id,
          client_id: client.id,
          created_by: client.created_by, // This will be set by RLS
          team_id,
          invoice_number,
          status: 'draft' as const,
          issue_date,
          due_date,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms: payment_terms || 'Net 30',
          notes,
          footer_text: footer_text || 'Thank you for your business!',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      const lineItemsData = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        organization_id: client.organization_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: index,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      // Return the created invoice with client info
      return {
        ...invoice,
        client,
        line_items: lineItemsData as any // Line items will be properly typed when queried from database
      } as any;

    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  },

  async getInvoicesByOrganization(organizationId: string, teamId?: string): Promise<CreatedInvoice[]> {
    try {
      let query = supabase
        .from('created_invoices')
        .select(`
          *,
          client:invoice_clients(*),
          line_items:invoice_line_items(*)
        `)
        .eq('organization_id', organizationId);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CreatedInvoice[];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices');
    }
  },

  async getSalesInvoices(organizationId: string, teamId?: string): Promise<CreatedInvoice[]> {
    try {
      // Get invoices that were created from inventory transactions (sales)
      let query = supabase
        .from('created_invoices')
        .select(`
          *,
          client:invoice_clients(*),
          line_items:invoice_line_items(*)
        `)
        .eq('organization_id', organizationId)
        .not('notes', 'is', null)
        .ilike('notes', '%sale%');

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CreatedInvoice[];
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
      return [];
    }
  }
};