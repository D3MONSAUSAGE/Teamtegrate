import React from 'react';
import { Cog } from 'lucide-react';
import { ProcessingTab } from '@/components/inventory/warehouse/ProcessingTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const WarehouseProcessingPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb 
          currentPage="Processing" 
          parentPage={{ name: "Warehouse", href: "/dashboard/inventory/warehouse" }}
        />
        
        <div className="flex items-center space-x-2 mb-6">
          <Cog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Warehouse Processing</h1>
            <p className="text-muted-foreground">
              Manage processing costs and workflow
            </p>
          </div>
        </div>

        <ProcessingTab />
      </div>
    </InventoryProvider>
  );
};

export default WarehouseProcessingPage;