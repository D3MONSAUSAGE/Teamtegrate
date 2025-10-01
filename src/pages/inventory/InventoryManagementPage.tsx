import React from 'react';
import { Settings } from 'lucide-react';
import { InventoryManagementTab } from '@/components/inventory/tabs/InventoryManagementTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';
import { MasterInventoryTabs } from '@/components/inventory/navigation/MasterInventoryTabs';

const InventoryManagementPage: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <InventoryBreadcrumb currentPage="Management" />
        <MasterInventoryTabs />
        
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage items, categories, units, vendors, and templates
            </p>
          </div>
        </div>

        <InventoryManagementTab />
      </div>
    </InventoryProvider>
  );
};

export default InventoryManagementPage;