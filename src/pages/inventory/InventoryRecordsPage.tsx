import React from 'react';
import { FileText } from 'lucide-react';
import { InventoryRecordsTab } from '@/components/inventory/tabs/InventoryRecordsTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const InventoryRecordsPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb currentPage="Records" />
        
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Inventory Records</h1>
            <p className="text-muted-foreground">
              View inventory history, transactions, and analytics
            </p>
          </div>
        </div>

        <InventoryRecordsTab />
      </div>
    </InventoryProvider>
  );
};

export default InventoryRecordsPage;