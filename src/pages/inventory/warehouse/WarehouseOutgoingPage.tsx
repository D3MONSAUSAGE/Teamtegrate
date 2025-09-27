import React from 'react';
import { Truck } from 'lucide-react';
import { OutgoingTab } from '@/components/inventory/warehouse/OutgoingTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const WarehouseOutgoingPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb 
          currentPage="Outgoing" 
          parentPage={{ name: "Warehouse", href: "/dashboard/inventory/warehouse" }}
        />
        
        <div className="flex items-center space-x-2 mb-6">
          <Truck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Outgoing Inventory</h1>
            <p className="text-muted-foreground">
              Manage outgoing shipments and sales
            </p>
          </div>
        </div>

        <OutgoingTab />
      </div>
    </InventoryProvider>
  );
};

export default WarehouseOutgoingPage;