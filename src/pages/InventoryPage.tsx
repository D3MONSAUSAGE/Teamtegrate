import React from 'react';
import { ResponsiveTabs, ResponsiveTabsContent, ResponsiveTabsList, ResponsiveTabsTrigger } from '@/components/ui/ResponsiveTabs';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Settings } from 'lucide-react';
import { InventoryCountTab } from '@/components/inventory/tabs/InventoryCountTab';
import { InventoryManagementTab } from '@/components/inventory/tabs/InventoryManagementTab';
import { InventoryRecordsTab } from '@/components/inventory/tabs/InventoryRecordsTab';
import { WarehouseTab } from '@/components/inventory/tabs/WarehouseTab';
import { InventoryProvider } from '@/contexts/inventory';

const InventoryPage: React.FC = () => {
  const { hasRoleAccess } = useAuth();

  return (
    <InventoryProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage your inventory items, conduct counts, and track stock levels
            </p>
          </div>
        </div>

        <ResponsiveTabs defaultValue="count" className="w-full">
          <ResponsiveTabsList>
            <ResponsiveTabsTrigger value="count" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Count
            </ResponsiveTabsTrigger>
            <ResponsiveTabsTrigger value="records" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Records
            </ResponsiveTabsTrigger>
            {hasRoleAccess('manager') && (
              <ResponsiveTabsTrigger value="warehouse" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Warehouse
              </ResponsiveTabsTrigger>
            )}
            {hasRoleAccess('manager') && (
              <ResponsiveTabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Management
              </ResponsiveTabsTrigger>
            )}
          </ResponsiveTabsList>

          <ResponsiveTabsContent value="count" className="mt-6">
            <InventoryCountTab />
          </ResponsiveTabsContent>

          <ResponsiveTabsContent value="records" className="mt-6">
            <InventoryRecordsTab />
          </ResponsiveTabsContent>

          {hasRoleAccess('manager') && (
            <ResponsiveTabsContent value="warehouse" className="mt-6">
              <WarehouseTab />
            </ResponsiveTabsContent>
          )}

          {hasRoleAccess('manager') && (
            <ResponsiveTabsContent value="management" className="mt-6">
              <InventoryManagementTab />
            </ResponsiveTabsContent>
          )}
        </ResponsiveTabs>
      </div>
    </InventoryProvider>
  );
};

export default InventoryPage;