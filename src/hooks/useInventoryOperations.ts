import { useCallback } from 'react';
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
  InventoryCategory,
  InventoryUnit
} from '@/contexts/inventory/types';
import { useInventoryErrorHandler } from './useInventoryErrorHandler';

interface UseInventoryOperationsProps {
  refreshItems: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshTeamAssignments: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshUnits: () => Promise<void>;
  refreshTemplateItems: () => Promise<void>;
}

export const useInventoryOperations = ({
  refreshItems,
  refreshTransactions,
  refreshCounts,
  refreshAlerts,
  refreshTemplates,
  refreshTeamAssignments,
  refreshCategories,
  refreshUnits,
  refreshTemplateItems,
}: UseInventoryOperationsProps) => {
  const { user } = useAuth();
  const { handleAsyncOperation } = useInventoryErrorHandler();

  // Item operations
  const createItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'base_unit' | 'calculated_unit_price' | 'organization_id' | 'created_by'>): Promise<InventoryItem | null> => {
    const itemWithOrgAndUser = { 
      ...item, 
      organization_id: user?.organizationId || '', 
      created_by: user?.id || ''
    };
    
    const result = await handleAsyncOperation(
      () => inventoryItemsApi.create(itemWithOrgAndUser),
      'Create Item',
      'Item created successfully'
    );
    
    if (result) {
      await refreshItems();
      return result;
    }
    return null;
  }, [user?.organizationId, user?.id, handleAsyncOperation, refreshItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
    const result = await handleAsyncOperation(
      () => inventoryItemsApi.update(id, updates),
      'Update Item',
      'Item updated successfully'
    );
    
    if (result) {
      await refreshItems();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshItems]);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryItemsApi.delete(id),
      'Delete Item',
      'Item deleted successfully'
    );
    
    if (result !== null) {
      await refreshItems();
    }
  }, [handleAsyncOperation, refreshItems]);

  const getItemById = useCallback(async (id: string): Promise<InventoryItem | null> => {
    return await handleAsyncOperation(
      () => inventoryItemsApi.getById(id),
      'Load Item Details'
    );
  }, [handleAsyncOperation]);

  const updateStock = useCallback(async (id: string, newStock: number): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryItemsApi.updateStock(id, newStock),
      'Update Stock',
      'Stock updated successfully'
    );
    
    if (result !== null) {
      await refreshItems();
    }
  }, [handleAsyncOperation, refreshItems]);

  // Category operations
  const createCategory = useCallback(async (category: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at' | 'organization_id'>): Promise<InventoryCategory | null> => {
    const categoryWithOrg = { ...category, organization_id: user?.organizationId || '' };
    
    const result = await handleAsyncOperation(
      () => inventoryCategoriesApi.create(categoryWithOrg),
      'Create Category',
      'Category created successfully'
    );
    
    if (result) {
      await refreshCategories();
      return result;
    }
    return null;
  }, [user?.organizationId, handleAsyncOperation, refreshCategories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<InventoryCategory>): Promise<InventoryCategory | null> => {
    const result = await handleAsyncOperation(
      () => inventoryCategoriesApi.update(id, updates),
      'Update Category',
      'Category updated successfully'
    );
    
    if (result) {
      await refreshCategories();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshCategories]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryCategoriesApi.delete(id),
      'Delete Category',
      'Category deleted successfully'
    );
    
    if (result !== null) {
      await refreshCategories();
    }
  }, [handleAsyncOperation, refreshCategories]);

  // Unit operations
  const createUnit = useCallback(async (unit: Omit<InventoryUnit, 'id' | 'created_at' | 'updated_at' | 'organization_id'>): Promise<InventoryUnit | null> => {
    const unitWithOrg = { ...unit, organization_id: user?.organizationId || '' };
    
    const result = await handleAsyncOperation(
      () => inventoryUnitsApi.create(unitWithOrg),
      'Create Unit',
      'Unit created successfully'
    );
    
    if (result) {
      await refreshUnits();
      return result;
    }
    return null;
  }, [user?.organizationId, handleAsyncOperation, refreshUnits]);

  const updateUnit = useCallback(async (id: string, updates: Partial<InventoryUnit>): Promise<InventoryUnit | null> => {
    const result = await handleAsyncOperation(
      () => inventoryUnitsApi.update(id, updates),
      'Update Unit',
      'Unit updated successfully'
    );
    
    if (result) {
      await refreshUnits();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshUnits]);

  const deleteUnit = useCallback(async (id: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryUnitsApi.delete(id),
      'Delete Unit',
      'Unit deleted successfully'
    );
    
    if (result !== null) {
      await refreshUnits();
    }
  }, [handleAsyncOperation, refreshUnits]);

  // Transaction operations
  const createTransaction = useCallback(async (transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTransactionsApi.create(transaction),
      'Create Transaction',
      'Transaction created successfully'
    );
    
    if (result) {
      await Promise.all([refreshTransactions(), refreshItems()]);
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshTransactions, refreshItems]);

  // Count operations
  const startInventoryCount = useCallback(async (notes?: string, teamId?: string, templateId?: string): Promise<InventoryCount | null> => {
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
    
    const result = await handleAsyncOperation(
      async () => {
        const newCount = await inventoryCountsApi.create(countData);
        await inventoryCountsApi.initializeCountItems(newCount.id);
        return newCount;
      },
      'Start Inventory Count',
      'Inventory count started successfully'
    );
    
    if (result) {
      await refreshCounts();
      return result;
    }
    return null;
  }, [user?.organizationId, user?.id, handleAsyncOperation, refreshCounts]);

  const updateCountItem = useCallback(async (countId: string, itemId: string, actualQuantity: number, notes?: string): Promise<void> => {
    await handleAsyncOperation(
      () => inventoryCountsApi.updateCountItem(countId, itemId, actualQuantity, notes, user?.id),
      'Update Count Item'
    );
  }, [user?.id, handleAsyncOperation]);

  const completeInventoryCount = useCallback(async (countId: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryCountsApi.update(countId, { status: 'completed' }),
      'Complete Inventory Count',
      'Inventory count completed successfully'
    );
    
    if (result !== null) {
      await refreshCounts();
    }
  }, [handleAsyncOperation, refreshCounts]);

  // Alert operations
  const resolveAlert = useCallback(async (alertId: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryAlertsApi.resolve(alertId, user?.id || ''),
      'Resolve Alert',
      'Alert resolved successfully'
    );
    
    if (result !== null) {
      await refreshAlerts();
    }
  }, [user?.id, handleAsyncOperation, refreshAlerts]);

  // Template operations
  const createTemplate = useCallback(async (template: Omit<InventoryTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryTemplate | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.create(template),
      'Create Template',
      'Template created successfully'
    );
    
    if (result) {
      await refreshTemplates();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<InventoryTemplate>): Promise<InventoryTemplate | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.update(id, updates),
      'Update Template',
      'Template updated successfully'
    );
    
    if (result) {
      await refreshTemplates();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshTemplates]);

  const assignTemplateToTeam = useCallback(async (templateId: string, teamId: string): Promise<TeamInventoryAssignment | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.assignToTeam(templateId, teamId, user?.id || ''),
      'Assign Template to Team',
      'Template assigned successfully'
    );
    
    if (result) {
      await refreshTeamAssignments();
      return result;
    }
    return null;
  }, [user?.id, handleAsyncOperation, refreshTeamAssignments]);

  const getTemplateItems = useCallback(async (templateId: string): Promise<InventoryTemplateItem[] | null> => {
    return await handleAsyncOperation(
      () => inventoryTemplatesApi.getTemplateItems(templateId),
      'Load Template Items'
    );
  }, [handleAsyncOperation]);

  const addItemToTemplate = useCallback(async (templateId: string, itemId: string, expectedQuantity: number = 0, minimumQuantity?: number, maximumQuantity?: number, sortOrder: number = 0): Promise<InventoryTemplateItem | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.addItemToTemplate(templateId, itemId, expectedQuantity, minimumQuantity, maximumQuantity, sortOrder),
      'Add Item to Template',
      'Item added to template successfully'
    );
    
    if (result) {
      await refreshTemplateItems();
    }
    return result;
  }, [handleAsyncOperation, refreshTemplateItems]);

  const removeItemFromTemplate = useCallback(async (templateId: string, itemId: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.removeItemFromTemplate(templateId, itemId),
      'Remove Item from Template',
      'Item removed from template successfully'
    );
    
    if (result !== null) {
      await refreshTemplateItems();
    }
  }, [handleAsyncOperation, refreshTemplateItems]);

  const duplicateTemplate = useCallback(async (templateId: string, newName?: string): Promise<InventoryTemplate | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.duplicate(templateId, newName),
      'Duplicate Template',
      'Template duplicated successfully'
    );
    
    if (result) {
      await refreshTemplates();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshTemplates]);

  const initializeCountItems = useCallback(async (countId: string, templateId?: string): Promise<void> => {
    await handleAsyncOperation(
      async () => {
        if (templateId) {
          const templateItems = await inventoryTemplatesApi.getTemplateItems(templateId);
          
          if (!templateItems || templateItems.length === 0) {
            throw new Error('Selected template has no items configured');
          }
          
          const countItems = templateItems.map(ti => ({
            count_id: countId,
            item_id: ti.item_id,
            expected_quantity: ti.expected_quantity || 0,
          }));
          
          await inventoryCountsApi.bulkCreateCountItems(countItems);
        } else {
          await inventoryCountsApi.initializeCountItems(countId);
        }
      },
      'Initialize Count Items',
      'Count items initialized successfully'
    );
    
    await refreshCounts();
  }, [handleAsyncOperation, refreshCounts]);

  return {
    // Item operations
    createItem,
    updateItem,
    deleteItem,
    getItemById,
    updateStock,
    
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Unit operations
    createUnit,
    updateUnit,
    deleteUnit,
    
    // Transaction operations
    createTransaction,
    
    // Count operations
    startInventoryCount,
    updateCountItem,
    completeInventoryCount,
    initializeCountItems,
    
    // Alert operations
    resolveAlert,
    
    // Template operations
    createTemplate,
    updateTemplate,
    assignTemplateToTeam,
    getTemplateItems,
    addItemToTemplate,
    removeItemFromTemplate,
    duplicateTemplate,
  };
};