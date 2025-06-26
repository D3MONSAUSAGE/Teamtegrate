
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InvoiceFilters from './invoice-list/InvoiceFilters';
import InvoiceTable from './invoice-list/InvoiceTable';
import EmptyState from './invoice-list/EmptyState';
import ImageViewerModal from './invoice-list/ImageViewerModal';
import InvoiceDataIntegrityChecker from './invoice-list/InvoiceDataIntegrityChecker';
import { useInvoiceData } from './invoice-list/useInvoiceData';
import { useInvoiceFilters } from './invoice-list/useInvoiceFilters';
import { useInvoiceActions } from './invoice-list/useInvoiceActions';

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

interface InvoiceListProps {
  refreshTrigger: number;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ refreshTrigger }) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const { invoices, isLoading, refetchInvoices } = useInvoiceData(refreshTrigger);
  const {
    searchTerm,
    setSearchTerm,
    selectedBranch,
    setSelectedBranch,
    dateFilter,
    setDateFilter,
    filteredInvoices,
    clearFilters
  } = useInvoiceFilters(invoices);
  const { downloadInvoice, viewInvoice, deleteInvoice } = useInvoiceActions();

  const handleView = (invoice: Invoice) => {
    viewInvoice(invoice, setImageUrl, setViewingInvoice, setViewModalOpen);
  };

  const handleDelete = (invoice: Invoice) => {
    deleteInvoice(invoice, refetchInvoices);
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
      {/* Data Integrity Checker - Only visible to admins */}
      <InvoiceDataIntegrityChecker />
      
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>
            Search, filter, view, download, and delete uploaded invoices
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
            onClearFilters={clearFilters}
          />

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </p>
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState hasInvoices={invoices.length > 0} />
          ) : (
            <InvoiceTable
              invoices={filteredInvoices}
              onView={handleView}
              onDownload={downloadInvoice}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <ImageViewerModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        invoice={viewingInvoice}
        imageUrl={imageUrl}
      />
    </div>
  );
};

export default InvoiceList;
