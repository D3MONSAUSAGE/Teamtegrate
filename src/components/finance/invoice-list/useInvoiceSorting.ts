import { useState, useMemo } from 'react';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';

type SortField = 'invoice_number' | 'invoice_date' | 'due_date' | 'vendor' | 'client' | 'total' | 'status' | 'created_at' | 'source' | 'origin' | 'paid' | 'balance';
type SortDirection = 'asc' | 'desc';

export const useInvoiceSorting = (invoices: UnifiedInvoice[]) => {
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'invoice_number':
          aVal = a.invoice_number;
          bVal = b.invoice_number;
          break;
        case 'invoice_date':
          aVal = new Date(a.invoice_date).getTime();
          bVal = new Date(b.invoice_date).getTime();
          break;
        case 'due_date':
          aVal = a.payment_due_date ? new Date(a.payment_due_date).getTime() : 0;
          bVal = b.payment_due_date ? new Date(b.payment_due_date).getTime() : 0;
          break;
        case 'source':
          aVal = a.source;
          bVal = b.source;
          break;
        case 'origin':
          aVal = a.source === 'uploaded' ? a.uploaded_data?.branch : 
                 (a.created_data?.warehouse_name || 'Manual');
          bVal = b.source === 'uploaded' ? b.uploaded_data?.branch : 
                 (b.created_data?.warehouse_name || 'Manual');
          break;
        case 'vendor':
          aVal = a.uploaded_data?.vendor?.name || '';
          bVal = b.uploaded_data?.vendor?.name || '';
          break;
        case 'client':
          aVal = a.created_data?.client_name || '';
          bVal = b.created_data?.client_name || '';
          break;
        case 'total':
          aVal = a.total_amount || 0;
          bVal = b.total_amount || 0;
          break;
        case 'paid':
          aVal = a.paid_amount || 0;
          bVal = b.paid_amount || 0;
          break;
        case 'balance':
          aVal = a.balance_due || 0;
          bVal = b.balance_due || 0;
          break;
        case 'status':
          aVal = a.payment_status || '';
          bVal = b.payment_status || '';
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sortBy, sortDirection]);

  return {
    sortedInvoices,
    sortBy,
    sortDirection,
    handleSort
  };
};
