export type InvoiceSource = 'uploaded' | 'created';
export type CreationMethod = 'manual' | 'warehouse_checkout';

export interface UnifiedInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  source: InvoiceSource;
  
  // Common tracking fields
  organization_id: string;
  team_id?: string;
  created_at: string;
  
  // Financial fields (normalized across sources)
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: string;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'void' | 'pending' | 'overdue' | 'cancelled';
  payment_due_date?: string;
  
  // Payment tracking
  has_payments: boolean;
  payment_count: number;
  last_payment_date?: string;
  
  // Source-specific data
  uploaded_data?: {
    branch: string;
    uploader_name: string;
    user_id: string;
    file_name: string;
    file_type: string;
    file_path: string;
    file_size: number;
    vendor?: { id: string; name: string; contact_email?: string; };
    expense_category?: { id: string; name: string; };
    payment_method?: string;
    reference_number?: string;
    notes?: string;
    tags?: string[];
  };
  
  created_data?: {
    creation_method: CreationMethod;
    warehouse_id?: string;
    warehouse_name?: string;
    client_id: string;
    client_name: string;
    client_email?: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issue_date: string;
    subtotal: number;
    tax_amount: number;
    line_items_count: number;
    payment_terms: string;
    sent_at?: string;
    paid_at?: string;
    notes?: string;
  };
}
