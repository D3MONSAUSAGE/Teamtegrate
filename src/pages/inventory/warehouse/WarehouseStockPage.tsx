import React from 'react';
import { Package } from 'lucide-react';
import { WarehouseStock } from '@/components/inventory/warehouse/WarehouseStock';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const WarehouseStockPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb 
          currentPage="Stock" 
          parentPage={{ name: "Warehouse", href: "/dashboard/inventory/warehouse" }}
        />
        
        <div className="flex items-center space-x-2 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Warehouse Stock</h1>
            <p className="text-muted-foreground">
              Monitor and manage warehouse stock levels
            </p>
          </div>
        </div>

        {/* Placeholder - would need warehouseId prop in real implementation */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">Stock management interface will be loaded here</p>
        </div>
      </div>
    </InventoryProvider>
  );
};

export default WarehouseStockPage;