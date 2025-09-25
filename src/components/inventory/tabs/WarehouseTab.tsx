import React, { useState, useEffect } from 'react';
import { WarehouseStock } from '../warehouse/WarehouseStock';
import { ReceiveStockDrawer } from '../warehouse/ReceiveStockDrawer';
import { TransferToTeamDrawer } from '../warehouse/TransferToTeamDrawer';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';

export const WarehouseTab: React.FC = () => {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadWarehouse();
  }, []);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      const data = await warehouseApi.getPrimaryWarehouse();
      setWarehouse(data);
    } catch (error) {
      // Check if the error is due to missing warehouse tables
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        // Tables don't exist yet - this is expected for new installations
        setWarehouse(null);
      } else {
        console.error('Error loading warehouse:', error);
        toast.error('Failed to load warehouse');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading warehouse...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warehouse Management</h2>
          <p className="text-muted-foreground">
            {warehouse 
              ? `Manage ${warehouse.name} stock levels, receive inventory, and transfer to teams`
              : 'Warehouse system is ready to be configured'
            }
          </p>
        </div>
        {warehouse && (
          <div className="flex flex-col sm:flex-row gap-2">
            <ReceiveStockDrawer 
              warehouseId={warehouse.id}
              onReceiptPosted={handleRefresh}
            />
            <TransferToTeamDrawer 
              warehouseId={warehouse.id}
              onTransferSent={handleRefresh}
            />
          </div>
        )}
      </div>

      <WarehouseStock 
        key={refreshKey}
        warehouseId={warehouse?.id} 
      />
    </div>
  );
};