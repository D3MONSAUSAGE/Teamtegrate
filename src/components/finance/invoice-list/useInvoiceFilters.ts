
import { useState, useEffect, useMemo } from 'react';

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
  vendor?: { id: string; name: string; contact_email?: string };
  expense_category?: { id: string; name: string };
}

export const useInvoiceFilters = (invoices: Invoice[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('All Vendors');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Search filter - expanded to include more fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(term) ||
        invoice.uploader_name.toLowerCase().includes(term) ||
        invoice.vendor?.name?.toLowerCase().includes(term) ||
        invoice.reference_number?.toLowerCase().includes(term) ||
        invoice.notes?.toLowerCase().includes(term)
      );
    }

    // Branch filter
    if (selectedBranch !== 'All Branches') {
      filtered = filtered.filter(invoice => invoice.branch === selectedBranch);
    }

    // Vendor filter
    if (selectedVendor !== 'All Vendors') {
      filtered = filtered.filter(invoice => invoice.vendor?.name === selectedVendor);
    }

    // Expense category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(invoice => invoice.expense_category?.name === selectedCategory);
    }

    // Payment status filter
    if (selectedPaymentStatus.length > 0) {
      filtered = filtered.filter(invoice => 
        invoice.payment_status && selectedPaymentStatus.includes(invoice.payment_status)
      );
    }

    // Amount range filter
    if (minAmount !== undefined) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_total !== undefined && invoice.invoice_total >= minAmount
      );
    }
    if (maxAmount !== undefined) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_total !== undefined && invoice.invoice_total <= maxAmount
      );
    }

    // Date filter (invoice date)
    if (dateFilter) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        const filterDate = new Date(dateFilter);
        return invoiceDate.toDateString() === filterDate.toDateString();
      });
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(invoice =>
        invoice.tags && invoice.tags.some(tag => selectedTags.includes(tag))
      );
    }

    return filtered;
  }, [invoices, searchTerm, selectedBranch, dateFilter, selectedVendor, selectedCategory, 
      selectedPaymentStatus, minAmount, maxAmount, selectedTags]);

  // Helper functions
  const getUniqueVendors = useMemo(() => {
    const vendors = invoices
      .map(inv => inv.vendor?.name)
      .filter((name): name is string => !!name);
    return ['All Vendors', ...Array.from(new Set(vendors)).sort()];
  }, [invoices]);

  const getUniqueCategories = useMemo(() => {
    const categories = invoices
      .map(inv => inv.expense_category?.name)
      .filter((name): name is string => !!name);
    return ['All Categories', ...Array.from(new Set(categories)).sort()];
  }, [invoices]);

  const getUniqueTags = useMemo(() => {
    const allTags = invoices
      .flatMap(inv => inv.tags || [])
      .filter(Boolean);
    return Array.from(new Set(allTags)).sort();
  }, [invoices]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedBranch !== 'All Branches') count++;
    if (selectedVendor !== 'All Vendors') count++;
    if (selectedCategory !== 'All Categories') count++;
    if (selectedPaymentStatus.length > 0) count++;
    if (minAmount !== undefined) count++;
    if (maxAmount !== undefined) count++;
    if (dateFilter) count++;
    if (selectedTags.length > 0) count++;
    return count;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBranch('All Branches');
    setDateFilter('');
    setSelectedVendor('All Vendors');
    setSelectedCategory('All Categories');
    setSelectedPaymentStatus([]);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setSelectedTags([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedBranch,
    setSelectedBranch,
    dateFilter,
    setDateFilter,
    selectedVendor,
    setSelectedVendor,
    selectedCategory,
    setSelectedCategory,
    selectedPaymentStatus,
    setSelectedPaymentStatus,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    selectedTags,
    setSelectedTags,
    filteredInvoices,
    clearFilters,
    getUniqueVendors,
    getUniqueCategories,
    getUniqueTags,
    getActiveFilterCount
  };
};
