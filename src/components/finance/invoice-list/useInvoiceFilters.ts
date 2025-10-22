import { useState, useEffect, useMemo } from 'react';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';

export const useInvoiceFilters = (invoices: UnifiedInvoice[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('All Vendors');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'uploaded' | 'created'>('all');
  const [creationMethodFilter, setCreationMethodFilter] = useState<'all' | 'manual' | 'warehouse_checkout'>('all');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Search filter - expanded to include more fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(term) ||
        (invoice.uploaded_data?.uploader_name?.toLowerCase().includes(term)) ||
        (invoice.uploaded_data?.vendor?.name?.toLowerCase().includes(term)) ||
        (invoice.uploaded_data?.reference_number?.toLowerCase().includes(term)) ||
        (invoice.uploaded_data?.notes?.toLowerCase().includes(term)) ||
        (invoice.created_data?.client_name?.toLowerCase().includes(term)) ||
        (invoice.created_data?.notes?.toLowerCase().includes(term))
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.source === sourceFilter);
    }

    // Creation method filter
    if (creationMethodFilter !== 'all') {
      filtered = filtered.filter(invoice => 
        invoice.source === 'created' && invoice.created_data?.creation_method === creationMethodFilter
      );
    }

    // Branch filter
    if (selectedBranch !== 'All Branches') {
      filtered = filtered.filter(invoice => 
        invoice.source === 'uploaded' && invoice.uploaded_data?.branch === selectedBranch
      );
    }

    // Vendor filter
    if (selectedVendor !== 'All Vendors') {
      filtered = filtered.filter(invoice => 
        invoice.source === 'uploaded' && invoice.uploaded_data?.vendor?.name === selectedVendor
      );
    }

    // Client filter
    if (selectedClient !== 'All Clients') {
      filtered = filtered.filter(invoice => 
        invoice.source === 'created' && invoice.created_data?.client_name === selectedClient
      );
    }

    // Warehouse filter
    if (selectedWarehouse !== 'All Warehouses') {
      filtered = filtered.filter(invoice => 
        invoice.source === 'created' && invoice.created_data?.warehouse_name === selectedWarehouse
      );
    }

    // Expense category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(invoice => 
        invoice.source === 'uploaded' && invoice.uploaded_data?.expense_category?.name === selectedCategory
      );
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
        invoice.total_amount !== undefined && invoice.total_amount >= minAmount
      );
    }
    if (maxAmount !== undefined) {
      filtered = filtered.filter(invoice => 
        invoice.total_amount !== undefined && invoice.total_amount <= maxAmount
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
        invoice.source === 'uploaded' && 
        invoice.uploaded_data?.tags && 
        invoice.uploaded_data.tags.some(tag => selectedTags.includes(tag))
      );
    }

    return filtered;
  }, [invoices, searchTerm, selectedBranch, dateFilter, selectedVendor, selectedCategory, 
      selectedPaymentStatus, minAmount, maxAmount, selectedTags, sourceFilter, creationMethodFilter,
      selectedClient, selectedWarehouse]);

  // Helper functions
  const getUniqueVendors = useMemo(() => {
    const vendors = invoices
      .filter(inv => inv.source === 'uploaded')
      .map(inv => inv.uploaded_data?.vendor?.name)
      .filter((name): name is string => !!name);
    return ['All Vendors', ...Array.from(new Set(vendors)).sort()];
  }, [invoices]);

  const getUniqueClients = useMemo(() => {
    const clients = invoices
      .filter(inv => inv.source === 'created')
      .map(inv => inv.created_data?.client_name)
      .filter((name): name is string => !!name);
    return ['All Clients', ...Array.from(new Set(clients)).sort()];
  }, [invoices]);

  const getUniqueWarehouses = useMemo(() => {
    const warehouses = invoices
      .filter(inv => inv.source === 'created')
      .map(inv => inv.created_data?.warehouse_name)
      .filter((name): name is string => !!name);
    return ['All Warehouses', ...Array.from(new Set(warehouses)).sort()];
  }, [invoices]);

  const getUniqueCategories = useMemo(() => {
    const categories = invoices
      .filter(inv => inv.source === 'uploaded')
      .map(inv => inv.uploaded_data?.expense_category?.name)
      .filter((name): name is string => !!name);
    return ['All Categories', ...Array.from(new Set(categories)).sort()];
  }, [invoices]);

  const getUniqueTags = useMemo(() => {
    const allTags = invoices
      .filter(inv => inv.source === 'uploaded')
      .flatMap(inv => inv.uploaded_data?.tags || [])
      .filter(Boolean);
    return Array.from(new Set(allTags)).sort();
  }, [invoices]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedBranch !== 'All Branches') count++;
    if (selectedVendor !== 'All Vendors') count++;
    if (selectedClient !== 'All Clients') count++;
    if (selectedWarehouse !== 'All Warehouses') count++;
    if (selectedCategory !== 'All Categories') count++;
    if (selectedPaymentStatus.length > 0) count++;
    if (minAmount !== undefined) count++;
    if (maxAmount !== undefined) count++;
    if (dateFilter) count++;
    if (selectedTags.length > 0) count++;
    if (sourceFilter !== 'all') count++;
    if (creationMethodFilter !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBranch('All Branches');
    setDateFilter('');
    setSelectedVendor('All Vendors');
    setSelectedClient('All Clients');
    setSelectedWarehouse('All Warehouses');
    setSelectedCategory('All Categories');
    setSelectedPaymentStatus([]);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setSelectedTags([]);
    setSourceFilter('all');
    setCreationMethodFilter('all');
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
    selectedClient,
    setSelectedClient,
    selectedWarehouse,
    setSelectedWarehouse,
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
    sourceFilter,
    setSourceFilter,
    creationMethodFilter,
    setCreationMethodFilter,
    filteredInvoices,
    clearFilters,
    getUniqueVendors,
    getUniqueClients,
    getUniqueWarehouses,
    getUniqueCategories,
    getUniqueTags,
    getActiveFilterCount
  };
};
