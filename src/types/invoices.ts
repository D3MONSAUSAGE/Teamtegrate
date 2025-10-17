export interface InvoiceClient {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  tax_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplate {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description?: string;
  default_payment_terms: string;
  default_tax_rate: number;
  footer_text?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadedInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  branch: string; // deprecated but keep for backward compat
  team_id: string;
  uploader_name: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  user_id: string;
  organization_id: string;
  created_at: string;
  
  // New financial tracking fields
  vendor_id?: string;
  invoice_total?: number;
  currency: string;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'void';
  payment_due_date?: string;
  paid_amount: number;
  expense_category_id?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  tags?: string[];
}

export interface PaymentType {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_cash_equivalent: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatedInvoice {
  id: string;
  organization_id: string;
  client_id: string;
  template_id?: string;
  created_by: string;
  team_id?: string;
  warehouse_id?: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_terms: string;
  notes?: string;
  footer_text?: string;
  stripe_invoice_id?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  client?: InvoiceClient;
  template?: InvoiceTemplate;
  line_items?: InvoiceLineItem[];
  payment_records?: PaymentRecord[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  organization_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'stripe' | 'wire_transfer' | 'check' | 'cash' | 'other';
  payment_type_id?: string;
  payment_type?: PaymentType;
  is_cash_payment: boolean;
  payment_date: string;
  reference_number?: string;
  stripe_payment_id?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

export interface WeeklySalesSummary {
  organization_id: string;
  warehouse_id?: string;
  team_id?: string;
  week_start: string;
  week_end: string;
  total_invoices: number;
  total_sales: number;
  total_collected: number;
  total_outstanding: number;
  paid_invoices_total: number;
  pending_invoices_total: number;
  overdue_invoices_total: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
}

export interface CashOnHandSummary {
  organization_id: string;
  warehouse_id?: string;
  team_id?: string;
  week_start: string;
  week_end: string;
  cash_collected: number;
  total_collected: number;
  payment_count: number;
  payment_methods_used: string[];
}

export interface OrganizationPaymentSettings {
  id: string;
  organization_id: string;
  stripe_account_id?: string;
  stripe_publishable_key?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  bank_name?: string;
  bank_address?: string;
  default_payment_terms: string;
  default_tax_rate: number;
  invoice_footer?: string;
  created_at: string;
  updated_at: string;
}