import React from 'react';
import { Warehouse } from 'lucide-react';
import { WarehouseTab } from '@/components/inventory/tabs/WarehouseTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const InventoryWarehousePage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb currentPage="Warehouse" />
        
        <div className="flex items-center space-x-2 mb-6">
          <Warehouse className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Warehouse Management</h1>
            <p className="text-muted-foreground">
              Manage warehouse stock, processing, and outgoing inventory
            </p>
          </div>
        </div>

        <WarehouseTab />
      </div>
    </InventoryProvider>
  );
};

export default InventoryWarehousePage;