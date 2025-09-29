import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { ReportsTab } from '@/components/inventory/warehouse/ReportsTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

const WarehouseReportsPage: React.FC = () => {
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const getDefaultWarehouse = async () => {
      if (!user?.organizationId) return;

      try {
        // Try to get the first warehouse for this organization
        const { data: warehouses, error } = await supabase
          .from('warehouses')
          .select('id')
          .eq('organization_id', user.organizationId)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching warehouse:', error);
          toast.error('Failed to load warehouse data');
          return;
        }

        if (warehouses?.id) {
          setWarehouseId(warehouses.id);
        } else {
          console.log('No warehouse found for organization');
          // If no warehouse exists, we'll show empty state
        }
      } catch (error) {
        console.error('Error in getDefaultWarehouse:', error);
        toast.error('Failed to load warehouse data');
      } finally {
        setLoading(false);
      }
    };

    getDefaultWarehouse();
  }, [user?.organizationId]);

  if (loading) {
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
                Loading warehouse data...
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </InventoryProvider>
    );
  }

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

        {warehouseId ? (
          <ReportsTab warehouseId={warehouseId} />
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Warehouse Found</h3>
            <p className="text-muted-foreground">
              Please create a warehouse first to view reports.
            </p>
          </div>
        )}
      </div>
    </InventoryProvider>
  );
};

export default WarehouseReportsPage;