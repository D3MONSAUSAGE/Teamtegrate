import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { warehouseApi, type Warehouse, type WarehouseItem } from './api/warehouseApi';
import { toast } from 'sonner';

interface WarehouseContextValue {
  // Current warehouse
  warehouse: Warehouse | null;
  warehouseItems: WarehouseItem[];
  
  // Loading states
  loading: boolean;
  itemsLoading: boolean;
  
  // Actions
  loadWarehouse: (warehouseId: string) => Promise<void>;
  refreshWarehouseItems: () => Promise<void>;
  updateItemStock: (itemId: string, quantityChange: number) => Promise<boolean>;
  
  // Error state
  error: string | null;
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

interface WarehouseProviderProps {
  children: React.ReactNode;
  warehouseId?: string;
}

export const WarehouseProvider: React.FC<WarehouseProviderProps> = ({ 
  children, 
  warehouseId 
}) => {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load warehouse by ID
  const loadWarehouse = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏭 [WarehouseContext] Loading warehouse:', id);
      
      // For now, we'll set the warehouse to null since we don't have getWarehouseById
      // This can be implemented later if needed
      setWarehouse(null);
      
      // Load warehouse items
      await refreshWarehouseItems();
      
      console.log('✅ [WarehouseContext] Warehouse loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load warehouse';
      console.error('❌ [WarehouseContext] Error loading warehouse:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh warehouse items
  const refreshWarehouseItems = useCallback(async () => {
    if (!warehouseId) return;
    
    try {
      setItemsLoading(true);
      setError(null);
      
      console.log('🔄 [WarehouseContext] Refreshing warehouse items for:', warehouseId);
      
      const items = await warehouseApi.listWarehouseItems(warehouseId);
      setWarehouseItems(items);
      
      console.log('✅ [WarehouseContext] Warehouse items refreshed:', items.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh warehouse items';
      console.error('❌ [WarehouseContext] Error refreshing items:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setItemsLoading(false);
    }
  }, [warehouseId]);

  // Update item stock with optimistic updates and validation
  const updateItemStock = useCallback(async (itemId: string, quantityChange: number): Promise<boolean> => {
    if (!warehouseId) {
      toast.error('No warehouse selected');
      return false;
    }

    try {
      console.log('📦 [WarehouseContext] Updating stock:', { itemId, quantityChange, warehouseId });
      
      // Find current item for validation
      const currentItem = warehouseItems.find(item => item.item_id === itemId);
      if (!currentItem) {
        throw new Error('Item not found in warehouse');
      }

      // Validate stock levels before attempting update
      const newStock = currentItem.on_hand + quantityChange;
      if (newStock < 0) {
        throw new Error(`Insufficient stock: trying to withdraw ${Math.abs(quantityChange)} but only ${currentItem.on_hand} available`);
      }

      // Optimistically update local state
      setWarehouseItems(prevItems => 
        prevItems.map(item => 
          item.item_id === itemId 
            ? { ...item, on_hand: Math.max(0, item.on_hand + quantityChange) }
            : item
        )
      );

      // Perform actual database update
      const success = await warehouseApi.updateWarehouseStock(warehouseId, itemId, quantityChange);
      
      if (!success) {
        // Revert optimistic update on failure
        setWarehouseItems(prevItems => 
          prevItems.map(item => 
            item.item_id === itemId 
              ? { ...item, on_hand: currentItem.on_hand }
              : item
          )
        );
        throw new Error('Failed to update warehouse stock');
      }

      console.log('✅ [WarehouseContext] Stock updated successfully');
      
      // Refresh to ensure data consistency (in background)
      setTimeout(() => refreshWarehouseItems(), 100);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stock';
      console.error('❌ [WarehouseContext] Error updating stock:', err);
      
      // Revert optimistic update on error
      const currentItem = warehouseItems.find(item => item.item_id === itemId);
      if (currentItem) {
        setWarehouseItems(prevItems => 
          prevItems.map(item => 
            item.item_id === itemId 
              ? { ...item, on_hand: currentItem.on_hand }
              : item
          )
        );
      }
      
      toast.error(errorMessage);
      return false;
    }
  }, [warehouseId, warehouseItems, refreshWarehouseItems]);

  // Auto-load warehouse when warehouseId changes
  useEffect(() => {
    if (warehouseId) {
      refreshWarehouseItems();
    } else {
      setWarehouse(null);
      setWarehouseItems([]);
    }
  }, [warehouseId, refreshWarehouseItems]);

  const value: WarehouseContextValue = {
    warehouse,
    warehouseItems,
    loading,
    itemsLoading,
    loadWarehouse,
    refreshWarehouseItems,
    updateItemStock,
    error
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};