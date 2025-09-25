import React, { useState, useEffect, useCallback } from 'react';
import { WarehouseStock } from '../warehouse/WarehouseStock';
import { NotConfigured } from '../warehouse/NotConfigured';
import { ReceiveStockDrawer } from '../warehouse/ReceiveStockDrawer';
import { TransferToTeamDrawer } from '../warehouse/TransferToTeamDrawer';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';

export const WarehouseTab: React.FC = () => {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWarehouse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await warehouseApi.getPrimaryWarehouse();
      setWarehouse(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if the error is due to missing warehouse tables
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        // Tables don't exist yet - this is a system configuration issue
        setError('Warehouse system not installed. Please contact system administrator.');
        setWarehouse(null);
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        // Permission/RLS issue
        setError('Access denied. You don\'t have permission to view warehouses.');
        setWarehouse(null);
      } else {
        // No warehouse exists (this is the normal "not configured" case)
        console.log('No warehouse found - showing setup screen');
        setWarehouse(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouse();
  }, [loadWarehouse]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading warehouse...</div>
        </div>
      </div>
    );
  }

  // Show system error if tables are missing or permissions are denied
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Warehouse Management</h2>
            <p className="text-muted-foreground">Warehouse system configuration</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-destructive font-medium mb-2">System Error</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Show setup screen if no warehouse exists
  if (!warehouse) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Warehouse Management</h2>
            <p className="text-muted-foreground">Set up your warehouse to start managing inventory</p>
          </div>
        </div>
        <NotConfigured onConfigured={loadWarehouse} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warehouse Management</h2>
          <p className="text-muted-foreground">
            Manage {warehouse.name} stock levels, receive inventory, and transfer to teams
          </p>
        </div>
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
      </div>

      <WarehouseStock 
        key={refreshKey}
        warehouseId={warehouse.id} 
      />
    </div>
  );
};