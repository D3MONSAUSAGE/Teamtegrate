export interface Invoice {
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
