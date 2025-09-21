import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Settings } from 'lucide-react';
import { InventoryCountTab } from '@/components/inventory/tabs/InventoryCountTab';
import { InventoryManagementTab } from '@/components/inventory/tabs/InventoryManagementTab';
import { InventoryRecordsTab } from '@/components/inventory/tabs/InventoryRecordsTab';
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

        <Tabs defaultValue="count" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="count" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Count
            </TabsTrigger>
            {hasRoleAccess('manager') && (
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Management
              </TabsTrigger>
            )}
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="count" className="mt-6">
            <InventoryCountTab />
          </TabsContent>

          {hasRoleAccess('manager') && (
            <TabsContent value="management" className="mt-6">
              <InventoryManagementTab />
            </TabsContent>
          )}

          <TabsContent value="records" className="mt-6">
            <InventoryRecordsTab />
          </TabsContent>
        </Tabs>
      </div>
    </InventoryProvider>
  );
};

export default InventoryPage;