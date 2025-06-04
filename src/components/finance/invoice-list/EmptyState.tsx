
import React from 'react';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  hasInvoices: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasInvoices }) => {
  return (
    <div className="text-center py-8">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {!hasInvoices 
          ? "Get started by uploading your first invoice."
          : "Try adjusting your search or filter criteria."}
      </p>
    </div>
  );
};

export default EmptyState;
