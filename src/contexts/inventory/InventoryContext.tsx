import React, { createContext, useContext, ReactNode } from 'react';
import { InventoryContextType } from './types';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { useAuth } from '@/contexts/AuthContext';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const { user, isReady } = useAuth();
  
  // Only initialize inventory management if user is ready and has organizationId
  const shouldInitialize = isReady && user?.organizationId;
  
  // Always provide context, but handle loading/error states within the context
  const inventoryData = shouldInitialize ? useEnhancedInventoryManagement() : null;
  
  // Create a minimal context value for non-initialized state
  const defaultContextValue: InventoryContextType = {
    // Data
    items: [],
    transactions: [],
    counts: [],
    alerts: [],
    categories: [],
    units: [],
    templates: [],
    templateItems: [],
    teamAssignments: [],
    
    // Loading states
    loading: !isReady,
    itemsLoading: false,
    transactionsLoading: false,
    countsLoading: false,
    alertsLoading: false,
    templatesLoading: false,
    categoriesLoading: false,
    unitsLoading: false,
    
    // Operations - all no-ops for non-initialized state
    createItem: async () => { throw new Error('Organization required'); },
    updateItem: async () => { throw new Error('Organization required'); },
    getItemById: async () => { throw new Error('Organization required'); },
    deleteItem: async () => { throw new Error('Organization required'); },
    updateStock: async () => { throw new Error('Organization required'); },
    createTransaction: async () => { throw new Error('Organization required'); },
    startInventoryCount: async () => { throw new Error('Organization required'); },
    updateCountItem: async () => { throw new Error('Organization required'); },
    completeInventoryCount: async () => { throw new Error('Organization required'); },
    cancelInventoryCount: async () => { throw new Error('Organization required'); },
    voidInventoryCount: async () => { throw new Error('Organization required'); },
    resolveAlert: async () => { throw new Error('Organization required'); },
    createCategory: async () => { throw new Error('Organization required'); },
    updateCategory: async () => { throw new Error('Organization required'); },
    deleteCategory: async () => { throw new Error('Organization required'); },
    createUnit: async () => { throw new Error('Organization required'); },
    updateUnit: async () => { throw new Error('Organization required'); },
    deleteUnit: async () => { throw new Error('Organization required'); },
    createTemplate: async () => { throw new Error('Organization required'); },
    updateTemplate: async () => { throw new Error('Organization required'); },
    deleteTemplate: async () => { throw new Error('Organization required'); },
    getTemplateItems: async () => { throw new Error('Organization required'); },
    addItemToTemplate: async () => { throw new Error('Organization required'); },
    updateTemplateItem: async () => { throw new Error('Organization required'); },
    removeItemFromTemplate: async () => { throw new Error('Organization required'); },
    duplicateTemplate: async () => { throw new Error('Organization required'); },
    assignTemplateToTeam: async () => { throw new Error('Organization required'); },
    getTeamAssignments: () => [],
    getTeamInventories: () => [],
    initializeCountItems: async () => { throw new Error('Organization required'); },
    repairCountExpectedQuantities: async () => { throw new Error('Organization required'); },
    refreshItems: async () => {},
    refreshTransactions: async () => {},
    refreshCounts: async () => {},
    refreshAlerts: async () => {},
    refreshTemplates: async () => {},
    refreshTeamAssignments: async () => {},
    refreshCategories: async () => {},
    refreshUnits: async () => {},
    refreshTemplateItems: async () => {},
    refreshData: async () => {},
  };
  
  return (
    <InventoryContext.Provider value={inventoryData || defaultContextValue}>
      {shouldInitialize ? (
        children
      ) : (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Organization Required
            </h3>
            <p className="text-sm text-muted-foreground">
              You need to be part of an organization to access inventory management.
            </p>
          </div>
        </div>
      )}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};