import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
        // Note: Don't initialize here, let the count tab handle initialization with template
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
      async () => {
        // Update count totals before completing
        await inventoryCountsApi.updateCountTotals(countId);
        
        // Complete the count
        const completedCount = await inventoryCountsApi.update(countId, { status: 'completed' });
        
        // Send notifications after successful completion
        if (completedCount && user) {
          try {
            // Get additional count details for notifications
            const { data: countDetails } = await supabase
              .from('inventory_counts')
              .select(`
                *,
                inventory_templates(name),
                teams(name)
              `)
              .eq('id', countId)
              .single();

            if (countDetails) {
              const { notifications } = await import('@/lib/notifications');
              
              await notifications.notifyInventoryTemplateCompleted(
                {
                  id: countDetails.id,
                  count_date: countDetails.count_date,
                  status: countDetails.status,
                  organization_id: countDetails.organization_id,
                  team_id: countDetails.team_id,
                  template_id: countDetails.template_id,
                  template_name: countDetails.inventory_templates?.name,
                  team_name: countDetails.teams?.name,
                  conducted_by: countDetails.conducted_by,
                  completion_percentage: countDetails.completion_percentage,
                  variance_count: countDetails.variance_count,
                  total_items_count: countDetails.total_items_count,
                  notes: countDetails.notes,
                },
                {
                  id: user.id,
                  email: user.email || '',
                  name: user.name,
                }
              );
            }
          } catch (notificationError) {
            console.error('Failed to send inventory completion notifications:', notificationError);
            // Don't throw - notifications shouldn't break the main flow
          }
        }
        
        return completedCount;
      },
      'Complete Inventory Count',
      'Inventory count completed successfully'
    );
    
    if (result !== null) {
      await refreshCounts();
    }
  }, [handleAsyncOperation, refreshCounts, user]);

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

  const updateTemplateItem = useCallback(async (
    templateId: string, 
    itemId: string, 
    updates: {
      expected_quantity?: number;
      minimum_quantity?: number;
      maximum_quantity?: number;
      sort_order?: number;
    }
  ): Promise<InventoryTemplateItem | null> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.updateTemplateItem(templateId, itemId, updates),
      'Update Template Item',
      'Template item updated successfully'
    );
    
    if (result) {
      await refreshTemplateItems();
      return result;
    }
    return null;
  }, [handleAsyncOperation, refreshTemplateItems]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    const result = await handleAsyncOperation(
      () => inventoryTemplatesApi.delete(id),
      'Delete Template',
      'Template deleted successfully'
    );
    
    if (result !== null) {
      await refreshTemplates();
    }
  }, [handleAsyncOperation, refreshTemplates]);

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
        // Use the centralized API method that handles both template and regular initialization
        await inventoryCountsApi.initializeCountItems(countId, templateId);
      },
      'Initialize Count Items',
      'Count items initialized successfully'
    );
    
    await refreshCounts();
  }, [handleAsyncOperation, refreshCounts]);

  const repairCountExpectedQuantities = useCallback(async (countId: string): Promise<void> => {
    await handleAsyncOperation(
      () => inventoryCountsApi.repairCountExpectedQuantities(countId),
      'Repair Count Expected Quantities',
      'Count expected quantities repaired successfully'
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
    repairCountExpectedQuantities,
    
    // Alert operations
    resolveAlert,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignTemplateToTeam,
    getTemplateItems,
    addItemToTemplate,
    removeItemFromTemplate,
    updateTemplateItem,
    duplicateTemplate,
  };
};