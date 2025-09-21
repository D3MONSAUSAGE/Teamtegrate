import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  inventoryItemsApi,
  inventoryTransactionsApi,
  inventoryCountsApi,
  inventoryAlertsApi,
  inventoryTemplatesApi
} from '@/contexts/inventory/api';
import { 
  InventoryItem, 
  InventoryTransaction, 
  InventoryCount, 
  InventoryAlert,
  InventoryTemplate,
  InventoryTemplateItem,
  TeamInventoryAssignment,
  InventoryContextType 
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
  
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const refreshItems = async () => {
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
  };

  const refreshTransactions = async () => {
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
  };

  const refreshCounts = async () => {
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
  };

  const startInventoryCount = async (notes?: string, teamId?: string, templateId?: string): Promise<InventoryCount> => {
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
  };

  const updateCountItem = async (countId: string, itemId: string, actualQuantity: number, notes?: string): Promise<void> => {
    await inventoryCountsApi.updateCountItem(countId, itemId, actualQuantity, notes, user?.id);
  };

  const completeInventoryCount = async (countId: string): Promise<void> => {
    await inventoryCountsApi.update(countId, { status: 'completed' });
    await refreshCounts();
  };

  const createItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    const newItem = await inventoryItemsApi.create(item);
    await refreshItems();
    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    const updatedItem = await inventoryItemsApi.update(id, updates);
    await refreshItems();
    return updatedItem;
  };

  const deleteItem = async (id: string): Promise<void> => {
    await inventoryItemsApi.delete(id);
    await refreshItems();
  };

  const createTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction> => {
    const newTransaction = await inventoryTransactionsApi.create(transaction);
    await refreshTransactions();
    return newTransaction;
  };

  const refreshAlerts = async () => {
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
  };

  const refreshTemplates = async () => {
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
  };

  const refreshTeamAssignments = async () => {
    if (!user?.organizationId) return;
    try {
      const data = await inventoryTemplatesApi.getTeamAssignments();
      setTeamAssignments(data);
    } catch (error) {
      console.error('Error fetching team assignments:', error);
    }
  };

  // Template operations
  const createTemplate = async (template: Omit<InventoryTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryTemplate> => {
    const newTemplate = await inventoryTemplatesApi.create(template);
    await refreshTemplates();
    return newTemplate;
  };

  const updateTemplate = async (id: string, updates: Partial<InventoryTemplate>): Promise<InventoryTemplate> => {
    const updatedTemplate = await inventoryTemplatesApi.update(id, updates);
    await refreshTemplates();
    return updatedTemplate;
  };

  const assignTemplateToTeam = async (templateId: string, teamId: string): Promise<TeamInventoryAssignment> => {
    const assignment = await inventoryTemplatesApi.assignToTeam(templateId, teamId, user?.id || '');
    await refreshTeamAssignments();
    return assignment;
  };

  const getTeamInventories = (teamId: string): TeamInventoryAssignment[] => {
    return teamAssignments.filter(assignment => assignment.team_id === teamId && assignment.is_active);
  };

  const resolveAlert = async (alertId: string): Promise<void> => {
    await inventoryAlertsApi.resolve(alertId, user?.id || '');
    await refreshAlerts();
  };

  useEffect(() => {
    if (user?.organizationId) {
      Promise.all([
        refreshItems(),
        refreshTransactions(),
        refreshCounts(),
        refreshAlerts(),
        refreshTemplates(),
        refreshTeamAssignments()
      ]).finally(() => setLoading(false));
    }
  }, [user?.organizationId]);

  return {
    // Data
    items,
    transactions,
    counts,
    alerts,
    templates,
    templateItems,
    teamAssignments,
    
    // Loading states
    loading,
    itemsLoading,
    transactionsLoading,
    countsLoading,
    alertsLoading,
    templatesLoading,
    
    // Operations
    createItem,
    updateItem,
    deleteItem,
    createTransaction,
    startInventoryCount,
    updateCountItem,
    completeInventoryCount,
    resolveAlert,
    
    // Template operations
    createTemplate,
    updateTemplate,
    assignTemplateToTeam,
    getTeamInventories,
    
    // Refresh functions
    refreshItems,
    refreshTransactions,
    refreshCounts,
    refreshAlerts,
    refreshTemplates,
    refreshTeamAssignments,
  };
};