import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InvoiceFilters from './invoice-list/InvoiceFilters';
import UnifiedInvoiceTable from './invoice-list/UnifiedInvoiceTable';
import EmptyState from './invoice-list/EmptyState';
import ImageViewerModal from './invoice-list/ImageViewerModal';
import InvoiceSummaryStats from './invoice-list/InvoiceSummaryStats';
import { RecordPaymentModal } from './invoice-list/RecordPaymentModal';
import { useUnifiedInvoiceData } from './invoice-list/useUnifiedInvoiceData';
import { useInvoiceFilters } from './invoice-list/useInvoiceFilters';
import { useInvoiceActions } from './invoice-list/useInvoiceActions';
import { useInvoiceSorting } from './invoice-list/useInvoiceSorting';
import { useInvoicePagination } from './invoice-list/useInvoicePagination';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';

interface InvoiceListProps {
  refreshTrigger: number;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ refreshTrigger }) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<UnifiedInvoice | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<UnifiedInvoice | null>(null);

  const { invoices, isLoading, refetchInvoices } = useUnifiedInvoiceData(refreshTrigger);
  const {
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
  } = useInvoiceFilters(invoices);
  
  const { sortedInvoices, sortBy, sortDirection, handleSort } = useInvoiceSorting(filteredInvoices);
  const { 
    paginatedInvoices, 
    currentPage, 
    itemsPerPage, 
    totalPages,
    setCurrentPage,
    setItemsPerPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage
  } = useInvoicePagination(sortedInvoices);
  
  const { downloadInvoice, viewInvoice, deleteInvoice } = useInvoiceActions();

  const handleView = (invoice: UnifiedInvoice) => {
    viewInvoice(invoice as any, setImageUrl, setViewingInvoice as any, setViewModalOpen);
  };

  const handleDelete = (invoice: UnifiedInvoice) => {
    deleteInvoice(invoice as any, refetchInvoices);
  };

  const handleRecordPayment = (invoice: UnifiedInvoice) => {
    setPaymentInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const handlePaymentRecorded = () => {
    refetchInvoices();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading invoices...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <InvoiceSummaryStats invoices={invoices} />
      
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>
            Manage all invoices: uploaded expense receipts, manually created sales invoices, and warehouse checkout invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            selectedVendor={selectedVendor}
            setSelectedVendor={setSelectedVendor}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPaymentStatus={selectedPaymentStatus}
            setSelectedPaymentStatus={setSelectedPaymentStatus}
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            maxAmount={maxAmount}
            setMaxAmount={setMaxAmount}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            onClearFilters={clearFilters}
            uniqueVendors={getUniqueVendors}
            uniqueCategories={getUniqueCategories}
            uniqueTags={getUniqueTags}
            activeFilterCount={getActiveFilterCount()}
          />

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedInvoices.length} of {sortedInvoices.length} invoices
              {filteredInvoices.length !== invoices.length && ` (filtered from ${invoices.length} total)`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState hasInvoices={invoices.length > 0} />
          ) : (
            <>
              <UnifiedInvoiceTable
                invoices={paginatedInvoices}
                onView={handleView}
                onDownload={(inv) => downloadInvoice(inv as any)}
                onDelete={handleDelete}
                onRecordPayment={handleRecordPayment}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={previousPage}
                          className={!hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink 
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={nextPage}
                          className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ImageViewerModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        invoice={viewingInvoice as any}
        imageUrl={imageUrl}
      />

      <RecordPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        invoice={paymentInvoice}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default InvoiceList;
