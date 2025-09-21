import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  InventoryContextType, 
  InventoryItem, 
  InventoryTransaction, 
  InventoryCount, 
  InventoryAlert 
} from '@/contexts/inventory/types';
import {
  inventoryItemsApi,
  inventoryTransactionsApi,
  inventoryCountsApi,
  inventoryAlertsApi
} from '@/contexts/inventory/api';

export const useEnhancedInventoryManagement = (): InventoryContextType => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Refresh functions
  const refreshItems = async () => {
    setItemsLoading(true);
    try {
      const data = await inventoryItemsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory items',
        variant: 'destructive',
      });
    } finally {
      setItemsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await inventoryTransactionsApi.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const refreshCounts = async () => {
    setCountsLoading(true);
    try {
      const data = await inventoryCountsApi.getAll();
      setCounts(data);
    } catch (error) {
      console.error('Error fetching inventory counts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory counts',
        variant: 'destructive',
      });
    } finally {
      setCountsLoading(false);
    }
  };

  const refreshAlerts = async () => {
    setAlertsLoading(true);
    try {
      const data = await inventoryAlertsApi.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch alerts',
        variant: 'destructive',
      });
    } finally {
      setAlertsLoading(false);
    }
  };

  // Operations
  const createItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    try {
      const newItem = await inventoryItemsApi.create(itemData);
      setItems(prev => [...prev, newItem]);
      toast({
        title: 'Success',
        description: 'Inventory item created successfully',
      });
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to create inventory item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    try {
      const updatedItem = await inventoryItemsApi.update(id, updates);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      toast({
        title: 'Success',
        description: 'Inventory item updated successfully',
      });
      return updatedItem;
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update inventory item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      await inventoryItemsApi.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete inventory item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createTransaction = async (transactionData: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction> => {
    try {
      const newTransaction = await inventoryTransactionsApi.create(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      // Refresh items to get updated stock levels
      await refreshItems();
      toast({
        title: 'Success',
        description: 'Transaction recorded successfully',
      });
      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to record transaction',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const startInventoryCount = async (notes?: string): Promise<InventoryCount> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const countData = {
        organization_id: user.organizationId,
        conducted_by: user.id,
        count_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        status: 'in_progress' as const,
        notes,
      };
      
      const newCount = await inventoryCountsApi.create(countData);
      await inventoryCountsApi.initializeCountItems(newCount.id);
      setCounts(prev => [newCount, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Inventory count started successfully',
      });
      return newCount;
    } catch (error) {
      console.error('Error starting inventory count:', error);
      toast({
        title: 'Error',
        description: 'Failed to start inventory count',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCountItem = async (countId: string, itemId: string, actualQuantity: number, notes?: string): Promise<void> => {
    try {
      await inventoryCountsApi.updateCountItem(countId, itemId, actualQuantity, notes, user?.id);
      toast({
        title: 'Success',
        description: 'Count item updated successfully',
      });
    } catch (error) {
      console.error('Error updating count item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update count item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const completeInventoryCount = async (countId: string): Promise<void> => {
    try {
      await inventoryCountsApi.update(countId, { status: 'completed' });
      setCounts(prev => prev.map(count => 
        count.id === countId ? { ...count, status: 'completed' } : count
      ));
      
      // Refresh items and alerts as the count completion might trigger stock updates
      await Promise.all([refreshItems(), refreshAlerts()]);
      
      toast({
        title: 'Success',
        description: 'Inventory count completed successfully',
      });
    } catch (error) {
      console.error('Error completing inventory count:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete inventory count',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const resolveAlert = async (alertId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await inventoryAlertsApi.resolve(alertId, user.id);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: 'Success',
        description: 'Alert resolved successfully',
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Initial data loading
  useEffect(() => {
    if (user) {
      Promise.all([
        refreshItems(),
        refreshTransactions(),
        refreshCounts(),
        refreshAlerts(),
      ]);
    }
  }, [user]);

  return {
    // Data
    items,
    transactions,
    counts,
    alerts,
    
    // Loading states
    loading: itemsLoading || transactionsLoading || countsLoading || alertsLoading,
    itemsLoading,
    transactionsLoading,
    countsLoading,
    alertsLoading,
    
    // Operations
    createItem,
    updateItem,
    deleteItem,
    createTransaction,
    startInventoryCount,
    updateCountItem,
    completeInventoryCount,
    resolveAlert,
    
    // Refresh functions
    refreshItems,
    refreshTransactions,
    refreshCounts,
    refreshAlerts,
  };
};