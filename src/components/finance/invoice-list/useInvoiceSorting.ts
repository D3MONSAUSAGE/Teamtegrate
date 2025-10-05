import { useState, useMemo } from 'react';
import type { Invoice } from '@/types/invoice';

type SortField = 'invoice_number' | 'invoice_date' | 'due_date' | 'vendor' | 'total' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export const useInvoiceSorting = (invoices: Invoice[]) => {
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
        case 'vendor':
          aVal = a.vendor?.name || '';
          bVal = b.vendor?.name || '';
          break;
        case 'total':
          aVal = a.invoice_total || 0;
          bVal = b.invoice_total || 0;
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
