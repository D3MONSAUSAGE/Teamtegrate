import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  inventoryItemsApi,
  inventoryTransactionsApi,
  inventoryCountsApi,
  inventoryAlertsApi,
  inventoryTemplatesApi,
  inventoryCategoriesApi,
  inventoryUnitsApi
} from '@/contexts/inventory/api';
import { 
  InventoryItem, 
  InventoryTransaction, 
  InventoryCount, 
  InventoryAlert,
  InventoryTemplate,
  InventoryTemplateItem,
  TeamInventoryAssignment,
  InventoryContextType,
  InventoryCategory,
  InventoryUnit
} from '@/contexts/inventory/types';

export const useEnhancedInventoryManagement = (): InventoryContextType => {
  const { user } = useAuth();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [templates, setTemplates] = useState<InventoryTemplate[]>([]);
  const [templateItems, setTemplateItems] = useState<InventoryTemplateItem[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<TeamInventoryAssignment[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Define all refresh functions with useCallback to prevent recreation
  const refreshItems = useCallback(async () => {
    if (!user?.organizationId) return;
    setItemsLoading(true);
    try {
      const data = await inventoryItemsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setItemsLoading(false);
    }
  }, [user?.organizationId]);

  const refreshTransactions = useCallback(async () => {
    if (!user?.organizationId) return;
    setTransactionsLoading(true);
    try {
      const data = await inventoryTransactionsApi.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user?.organizationId]);

  const refreshCounts = useCallback(async () => {
    if (!user?.organizationId) return;
    setCountsLoading(true);
    try {
      const data = await inventoryCountsApi.getAll();
      setCounts(data);
    } catch (error) {
      console.error('Error fetching inventory counts:', error);
    } finally {
      setCountsLoading(false);
    }
  }, [user?.organizationId]);

  const refreshAlerts = useCallback(async () => {
    if (!user?.organizationId) return;
    setAlertsLoading(true);
    try {
      const data = await inventoryAlertsApi.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, [user?.organizationId]);

  const refreshTemplates = useCallback(async () => {
    if (!user?.organizationId) return;
    setTemplatesLoading(true);
    try {
      const data = await inventoryTemplatesApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching inventory templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, [user?.organizationId]);

  const refreshCategories = useCallback(async () => {
    if (!user?.organizationId) return;
    setCategoriesLoading(true);
    try {
      const data = await inventoryCategoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [user?.organizationId]);

  const refreshUnits = useCallback(async () => {
    if (!user?.organizationId) return;
    setUnitsLoading(true);
    try {
      const data = await inventoryUnitsApi.getAll();
      setUnits(data);
    } catch (error) {
      console.error('Error fetching inventory units:', error);
    } finally {
      setUnitsLoading(false);
    }
  }, [user?.organizationId]);

  // CRUD Operations
  const createItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'base_unit' | 'calculated_unit_price'>): Promise<InventoryItem> => {
    const newItem = await inventoryItemsApi.create(item);
    await refreshItems();
    return newItem;
  }, [refreshItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    const updatedItem = await inventoryItemsApi.update(id, updates);
    await refreshItems();
    return updatedItem;
  }, [refreshItems]);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    await inventoryItemsApi.delete(id);
    await refreshItems();
  }, [refreshItems]);

  const getItemById = useCallback(async (id: string): Promise<InventoryItem | null> => {
    return await inventoryItemsApi.getById(id);
  }, []);

  const updateStock = useCallback(async (id: string, newStock: number): Promise<void> => {
    await inventoryItemsApi.updateStock(id, newStock);
    await refreshItems();
  }, [refreshItems]);

  const createTransaction = useCallback(async (transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction> => {
    const newTransaction = await inventoryTransactionsApi.create(transaction);
    await refreshTransactions();
    return newTransaction;
  }, [refreshTransactions]);

  const startInventoryCount = useCallback(async (notes?: string, teamId?: string, templateId?: string): Promise<InventoryCount> => {
    const countData = {
      organization_id: user?.organizationId || '',
      count_date: new Date().toISOString(),
      status: 'in_progress' as const,
      conducted_by: user?.id || '',
      notes,
      team_id: teamId,
      template_id: templateId,
      assigned_to: user?.id,
      completion_percentage: 0,
      variance_count: 0,
      total_items_count: 0
    };
    
    const newCount = await inventoryCountsApi.create(countData);
    await inventoryCountsApi.initializeCountItems(newCount.id);
    await refreshCounts();
    return newCount;
  }, [user?.organizationId, user?.id, refreshCounts]);

  const updateCountItem = useCallback(async (countId: string, itemId: string, actualQuantity: number, notes?: string): Promise<void> => {
    await inventoryCountsApi.updateCountItem(countId, itemId, actualQuantity, notes, user?.id);
  }, [user?.id]);

  const completeInventoryCount = useCallback(async (countId: string): Promise<void> => {
    await inventoryCountsApi.update(countId, { status: 'completed' });
    await refreshCounts();
  }, [refreshCounts]);

  const resolveAlert = useCallback(async (alertId: string): Promise<void> => {
    await inventoryAlertsApi.resolve(alertId, user?.id || '');
    await refreshAlerts();
  }, [user?.id, refreshAlerts]);

  // Template operations
  const createTemplate = useCallback(async (template: Omit<InventoryTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryTemplate> => {
    const newTemplate = await inventoryTemplatesApi.create(template);
    await refreshTemplates();
    return newTemplate;
  }, [refreshTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<InventoryTemplate>): Promise<InventoryTemplate> => {
    const updatedTemplate = await inventoryTemplatesApi.update(id, updates);
    await refreshTemplates();
    return updatedTemplate;
  }, [refreshTemplates]);

  const assignTemplateToTeam = useCallback(async (templateId: string, teamId: string): Promise<TeamInventoryAssignment> => {
    const assignment = await inventoryTemplatesApi.assignToTeam(templateId, teamId, user?.id || '');
    await refreshTeamAssignments();
    return assignment;
  }, [user?.id, refreshTeamAssignments]);

  const getTeamInventories = useCallback((teamId: string): TeamInventoryAssignment[] => {
    return teamAssignments.filter(assignment => assignment.team_id === teamId && assignment.is_active);
  }, [teamAssignments]);

  // Template item operations
  const getTemplateItems = useCallback(async (templateId: string): Promise<InventoryTemplateItem[]> => {
    return await inventoryTemplatesApi.getTemplateItems(templateId);
  }, []);

  const addItemToTemplate = useCallback(async (templateId: string, itemId: string, expectedQuantity: number = 0, sortOrder: number = 0): Promise<InventoryTemplateItem> => {
    return await inventoryTemplatesApi.addItemToTemplate(templateId, itemId, expectedQuantity, sortOrder);
  }, []);

  const removeItemFromTemplate = useCallback(async (templateId: string, itemId: string): Promise<void> => {
    await inventoryTemplatesApi.removeItemFromTemplate(templateId, itemId);
  }, []);

  const duplicateTemplate = useCallback(async (templateId: string, newName?: string): Promise<InventoryTemplate> => {
    return await inventoryTemplatesApi.duplicate(templateId, newName);
  }, []);

  const initializeCountItems = useCallback(async (countId: string, templateId?: string) => {
    if (templateId) {
      const templateItems = await inventoryTemplatesApi.getTemplateItems(templateId);
      const countItems = templateItems.map(ti => ({
        count_id: countId,
        item_id: ti.item_id,
        expected_quantity: ti.expected_quantity || 0,
      }));
      await inventoryCountsApi.bulkCreateCountItems(countItems);
    } else {
      await inventoryCountsApi.initializeCountItems(countId);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshItems(),
      refreshTransactions(),
      refreshCounts(),
      refreshAlerts(),
      refreshTemplates(),
      refreshTeamAssignments(),
      refreshCategories(),
      refreshUnits(),
    ]);
  }, [refreshItems, refreshTransactions, refreshCounts, refreshAlerts, refreshTemplates, refreshTeamAssignments, refreshCategories, refreshUnits]);

  // Load initial data
  useEffect(() => {
    if (user?.organizationId) {
      Promise.all([
        refreshItems(),
        refreshTransactions(),
        refreshCounts(),
        refreshAlerts(),
        refreshTemplates(),
        refreshTeamAssignments(),
        refreshCategories(),
        refreshUnits()
      ]).finally(() => setLoading(false));
    }
  }, [user?.organizationId, refreshItems, refreshTransactions, refreshCounts, refreshAlerts, refreshTemplates, refreshTeamAssignments, refreshCategories, refreshUnits]);

  return {
    // Data
    items,
    transactions,
    counts,
    alerts,
    templates,
    templateItems,
    teamAssignments,
    categories,
    units,
    
    // Loading states
    loading,
    itemsLoading,
    transactionsLoading,
    countsLoading,
    alertsLoading,
    templatesLoading,
    categoriesLoading,
    unitsLoading,
    
    // Operations
    createItem,
    updateItem,
    getItemById,
    deleteItem,
    updateStock,
    createTransaction,
    startInventoryCount,
    updateCountItem,
    completeInventoryCount,
    resolveAlert,
    
    // Categories operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Units operations
    createUnit,
    updateUnit,
    deleteUnit,
    
    // Template operations
    createTemplate,
    updateTemplate,
    assignTemplateToTeam,
    getTeamInventories,
    getTemplateItems,
    addItemToTemplate,
    removeItemFromTemplate,
    duplicateTemplate,
    getTeamAssignments: () => teamAssignments,
    initializeCountItems,
    
    // Refresh functions
    refreshItems,
    refreshTransactions,
    refreshCounts,
    refreshAlerts,
    refreshTemplates,
    refreshTeamAssignments,
    refreshCategories,
    refreshUnits,
    refreshData: refreshAll,
  };
};