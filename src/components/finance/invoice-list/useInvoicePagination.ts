import { useState, useMemo } from 'react';

interface Invoice {
  id: string;
  [key: string]: any;
}

export const useInvoicePagination = (invoices: Invoice[]) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return invoices.slice(start, start + itemsPerPage);
  }, [invoices, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to page 1 when invoices change
  useMemo(() => {
    setCurrentPage(1);
  }, [invoices.length]);

  return {
    paginatedInvoices,
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage: goToPage,
    setItemsPerPage,
    nextPage,
    previousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
};
