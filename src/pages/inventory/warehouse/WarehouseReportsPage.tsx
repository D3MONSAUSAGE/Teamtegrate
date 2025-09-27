import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ReportsTab } from '@/components/inventory/warehouse/ReportsTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';

const WarehouseReportsPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb 
          currentPage="Reports" 
          parentPage={{ name: "Warehouse", href: "/dashboard/inventory/warehouse" }}
        />
        
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Warehouse Reports</h1>
            <p className="text-muted-foreground">
              View warehouse analytics and performance metrics
            </p>
          </div>
        </div>

        <ReportsTab />
      </div>
    </InventoryProvider>
  );
};

export default WarehouseReportsPage;