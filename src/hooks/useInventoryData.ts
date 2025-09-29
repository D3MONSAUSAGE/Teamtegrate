import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  inventoryItemsApi,
  inventoryTransactionsApi,
  inventoryCountsApi,
  inventoryAlertsApi,
  inventoryTemplatesApi,
  inventoryCategoriesApi,
  inventoryUnitsApi,
  vendorsApi
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
  InventoryUnit,
  Vendor
} from '@/contexts/inventory/types';
import { useInventoryErrorHandler } from './useInventoryErrorHandler';

interface UseInventoryDataReturn {
  // Data
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  counts: InventoryCount[];
  alerts: InventoryAlert[];
  templates: InventoryTemplate[];
  templateItems: InventoryTemplateItem[];
  teamAssignments: TeamInventoryAssignment[];
  categories: InventoryCategory[];
  units: InventoryUnit[];
  vendors: Vendor[];
  
  // Loading states
  loading: boolean;
  itemsLoading: boolean;
  transactionsLoading: boolean;
  countsLoading: boolean;
  alertsLoading: boolean;
  templatesLoading: boolean;
  categoriesLoading: boolean;
  unitsLoading: boolean;
  vendorsLoading: boolean;
  
  // Refresh functions
  refreshItems: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshTeamAssignments: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshUnits: () => Promise<void>;
  refreshVendors: () => Promise<void>;
  refreshTemplateItems: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useInventoryData = (): UseInventoryDataReturn => {
  const { user } = useAuth();
  const { handleAsyncOperation } = useInventoryErrorHandler();
  
  // Data state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [templates, setTemplates] = useState<InventoryTemplate[]>([]);
  const [templateItems, setTemplateItems] = useState<InventoryTemplateItem[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<TeamInventoryAssignment[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Optimized refresh functions with error handling
  const refreshItems = useCallback(async () => {
    if (!user?.organizationId) return;
    setItemsLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryItemsApi.getAll(),
        'Load Items'
      );
      if (data) setItems(data);
    } finally {
      setItemsLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshTransactions = useCallback(async () => {
    if (!user?.organizationId) return;
    setTransactionsLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryTransactionsApi.getAll(),
        'Load Transactions'
      );
      if (data) setTransactions(data);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshCounts = useCallback(async () => {
    if (!user?.organizationId) return;
    setCountsLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryCountsApi.getAll(),
        'Load Inventory Counts'
      );
      if (data) setCounts(data);
    } finally {
      setCountsLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshAlerts = useCallback(async () => {
    if (!user?.organizationId) return;
    setAlertsLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryAlertsApi.getAll(),
        'Load Alerts'
      );
      if (data) setAlerts(data);
    } finally {
      setAlertsLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshTemplates = useCallback(async () => {
    if (!user?.organizationId) return;
    setTemplatesLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryTemplatesApi.getAll(),
        'Load Templates'
      );
      if (data) setTemplates(data);
    } finally {
      setTemplatesLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshTeamAssignments = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      const data = await handleAsyncOperation(
        () => inventoryTemplatesApi.getTeamAssignments(),
        'Load Team Assignments'
      );
      if (data) setTeamAssignments(data);
    } catch (error) {
      console.error('Error refreshing team assignments:', error);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshCategories = useCallback(async () => {
    if (!user?.organizationId) return;
    setCategoriesLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryCategoriesApi.getAll(),
        'Load Categories'
      );
      if (data) setCategories(data);
    } finally {
      setCategoriesLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshUnits = useCallback(async () => {
    if (!user?.organizationId) return;
    setUnitsLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => inventoryUnitsApi.getAll(),
        'Load Units'
      );
      if (data) setUnits(data);
    } finally {
      setUnitsLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshVendors = useCallback(async () => {
    if (!user?.organizationId) return;
    setVendorsLoading(true);
    try {
      const data = await handleAsyncOperation(
        () => vendorsApi.getAll(),
        'Load Vendors'
      );
      if (data) setVendors(data);
    } finally {
      setVendorsLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshTemplateItems = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      // Get all template items in one call - no dependency on templates state
      const allTemplateItems = await handleAsyncOperation(
        () => inventoryTemplatesApi.getAllTemplateItems(),
        'Load Template Items'
      );
      if (allTemplateItems) {
        setTemplateItems(allTemplateItems);
      }
    } catch (error) {
      console.error('Error refreshing template items:', error);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  const refreshAll = useCallback(async () => {
    if (!user?.organizationId) return;
    
    const refreshFunctions = [
      refreshItems,
      refreshTransactions,
      refreshCounts,
      refreshAlerts,
      refreshTemplates,
      refreshTeamAssignments,
      refreshCategories,
      refreshUnits,
      refreshVendors,
      refreshTemplateItems, // Load template items in parallel
    ];
    
    await Promise.allSettled(refreshFunctions.map(fn => fn()));
  }, [
    user?.organizationId,
    refreshItems,
    refreshTransactions,
    refreshCounts,
    refreshAlerts,
    refreshTemplates,
    refreshTeamAssignments,
    refreshCategories,
    refreshUnits,
    refreshVendors,
    refreshTemplateItems,
  ]);

  // Load template items independently - no dependency on templates
  useEffect(() => {
    if (user?.organizationId) {
      refreshTemplateItems();
    }
  }, [user?.organizationId, refreshTemplateItems]);

  // Stable initial data load function - avoid dependency cycle
  const initialLoad = useCallback(async () => {
    if (!user?.organizationId) return;
    
    setLoading(true);
    try {
      // Direct API calls to avoid refresh function dependencies
      const loadPromises = [
        handleAsyncOperation(() => inventoryItemsApi.getAll(), 'Load Items')
          .then(data => data && setItems(data)),
        handleAsyncOperation(() => inventoryTransactionsApi.getAll(), 'Load Transactions')
          .then(data => data && setTransactions(data)),
        handleAsyncOperation(() => inventoryCountsApi.getAll(), 'Load Inventory Counts')
          .then(data => data && setCounts(data)),
        handleAsyncOperation(() => inventoryAlertsApi.getAll(), 'Load Alerts')
          .then(data => data && setAlerts(data)),
        handleAsyncOperation(() => inventoryTemplatesApi.getAll(), 'Load Templates')
          .then(data => data && setTemplates(data)),
        handleAsyncOperation(() => inventoryTemplatesApi.getTeamAssignments(), 'Load Team Assignments')
          .then(data => data && setTeamAssignments(data)),
        handleAsyncOperation(() => inventoryCategoriesApi.getAll(), 'Load Categories')
          .then(data => data && setCategories(data)),
        handleAsyncOperation(() => inventoryUnitsApi.getAll(), 'Load Units')
          .then(data => data && setUnits(data)),
        handleAsyncOperation(() => vendorsApi.getAll(), 'Load Vendors')
          .then(data => data && setVendors(data)),
        handleAsyncOperation(() => inventoryTemplatesApi.getAllTemplateItems(), 'Load Template Items')
          .then(data => data && setTemplateItems(data)),
      ];
      
      await Promise.allSettled(loadPromises);
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId, handleAsyncOperation]);

  // Initial data load - only depends on organizationId and handleAsyncOperation
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

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
    vendors,
    
    // Loading states
    loading,
    itemsLoading,
    transactionsLoading,
    countsLoading,
    alertsLoading,
    templatesLoading,
    categoriesLoading,
    unitsLoading,
    vendorsLoading,
    
    // Refresh functions
    refreshItems,
    refreshTransactions,
    refreshCounts,
    refreshAlerts,
    refreshTemplates,
    refreshTeamAssignments,
    refreshCategories,
    refreshUnits,
    refreshVendors,
    refreshTemplateItems,
    refreshAll,
  };
};