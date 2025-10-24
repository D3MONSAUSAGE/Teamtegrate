import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { InventoryProvider, WarehouseSelectionProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';
import { MasterInventoryTabs } from '@/components/inventory/navigation/MasterInventoryTabs';
import { RecallManagementPage } from '@/components/inventory/recall/RecallManagementPage';

const InventoryRecallPage: React.FC = () => {
  return (
    <InventoryProvider>
      <WarehouseSelectionProvider>
        <div className="container mx-auto p-6 space-y-6">
          <InventoryBreadcrumb currentPage="Recall Management" />
          <MasterInventoryTabs />
          
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Lot Tracking & Recall Management</h1>
              <p className="text-muted-foreground">
                Complete traceability from manufacturing to distribution
              </p>
            </div>
          </div>

          <RecallManagementPage />
        </div>
      </WarehouseSelectionProvider>
    </InventoryProvider>
  );
};

export default InventoryRecallPage;
