
import { useState, useEffect, useMemo } from 'react';

interface Invoice {
  id: string;
  invoice_number: string;
  branch: string;
  uploader_name: string;
  invoice_date: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

export const useInvoiceFilters = (invoices: Invoice[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [dateFilter, setDateFilter] = useState('');

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.uploader_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Branch filter
    if (selectedBranch !== 'All Branches') {
      filtered = filtered.filter(invoice => invoice.branch === selectedBranch);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        const filterDate = new Date(dateFilter);
        return invoiceDate.toDateString() === filterDate.toDateString();
      });
    }

    return filtered;
  }, [invoices, searchTerm, selectedBranch, dateFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBranch('All Branches');
    setDateFilter('');
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedBranch,
    setSelectedBranch,
    dateFilter,
    setDateFilter,
    filteredInvoices,
    clearFilters
  };
};
