import React, { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import { OutgoingTab } from '@/components/inventory/warehouse/OutgoingTab';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { toast } from 'sonner';

const WarehouseOutgoingPage: React.FC = () => {
  const { user } = useAuth();
  const { availableTeams } = useTeamAccess();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarehouse();
  }, [availableTeams]);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      
      // Use team-based warehouse logic - get user's first available team's warehouse
      if (availableTeams.length > 0) {
        const teamWarehouse = await warehouseApi.getWarehouseByTeam(availableTeams[0].id);
        setWarehouse(teamWarehouse);
      } else {
        setWarehouse(null);
      }
    } catch (error) {
      console.error('Error loading warehouse:', error);
      toast.error('Failed to load warehouse information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <InventoryProvider>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </InventoryProvider>
    );
  }

  if (!warehouse) {
    return (
      <InventoryProvider>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No Team Warehouse Found</h2>
            <p className="text-muted-foreground">
              {availableTeams.length === 0 
                ? "You need to be assigned to a team to manage outgoing inventory."
                : "No warehouse is set up for your team. Please contact an administrator."
              }
            </p>
          </div>
        </div>
      </InventoryProvider>
    );
  }
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

        <OutgoingTab warehouseId={warehouse.id} />
      </div>
    </InventoryProvider>
  );
};

export default WarehouseOutgoingPage;