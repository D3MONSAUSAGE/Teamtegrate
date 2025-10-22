import React from 'react';
import { RecordPaymentDialog } from '@/components/inventory/warehouse/tabs/RecordPaymentDialog';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';
import type { CreatedInvoice } from '@/types/invoices';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: UnifiedInvoice | null;
  onPaymentRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onOpenChange,
  invoice,
  onPaymentRecorded
}) => {
  if (!invoice || invoice.source !== 'created') {
    return null;
  }

  // Transform UnifiedInvoice to CreatedInvoice format expected by RecordPaymentDialog
  const createdInvoice: CreatedInvoice = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    total_amount: invoice.total_amount,
    paid_amount: invoice.paid_amount,
    balance_due: invoice.balance_due,
    organization_id: invoice.organization_id,
    client_id: invoice.created_data?.client_id || '',
    created_by: invoice.created_data?.client_id || '',
    team_id: invoice.team_id,
    warehouse_id: invoice.created_data?.warehouse_id,
    status: invoice.created_data?.status || 'draft',
    payment_status: invoice.payment_status as any,
    issue_date: invoice.created_data?.issue_date || invoice.invoice_date,
    due_date: invoice.payment_due_date || invoice.invoice_date,
    subtotal: invoice.created_data?.subtotal || invoice.total_amount,
    tax_amount: invoice.created_data?.tax_amount || 0,
    payment_terms: invoice.created_data?.payment_terms || 'Due on receipt',
    notes: invoice.created_data?.notes,
    sent_at: invoice.created_data?.sent_at,
    paid_at: invoice.created_data?.paid_at,
    created_at: invoice.created_at,
    updated_at: invoice.created_at
  };

  return (
    <RecordPaymentDialog
      open={open}
      onOpenChange={onOpenChange}
      invoice={createdInvoice}
      onPaymentRecorded={onPaymentRecorded}
    />
  );
};
