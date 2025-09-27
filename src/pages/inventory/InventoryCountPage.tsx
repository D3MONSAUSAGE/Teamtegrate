import React from 'react';
import { Package } from 'lucide-react';
import { InventoryCountTab } from '@/components/inventory/tabs/InventoryCountTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const InventoryCountPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb currentPage="Inventory Count" />
        
        <div className="flex items-center space-x-2 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Inventory Count</h1>
            <p className="text-muted-foreground">
              Conduct physical inventory counts and track stock levels
            </p>
          </div>
        </div>

        <InventoryCountTab />
      </div>
    </InventoryProvider>
  );
};

export default InventoryCountPage;