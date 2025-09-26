import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  InventoryContextType,
  TeamInventoryAssignment
} from '@/contexts/inventory/types';
import { useInventoryData } from './useInventoryData';
import { useInventoryOperations } from './useInventoryOperations';

export const useEnhancedInventoryManagement = (): InventoryContextType => {
  const { user } = useAuth();
  // Use optimized data management hooks
  const {
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
    loading,
    itemsLoading,
    transactionsLoading,
    countsLoading,
    alertsLoading,
    templatesLoading,
    categoriesLoading,
    unitsLoading,
    vendorsLoading,
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
  } = useInventoryData();

  // Get operations using the optimized operations hook
  const operations = useInventoryOperations({
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
  });

  // Helper function for team inventory assignments
  const getTeamInventories = (teamId: string): TeamInventoryAssignment[] => {
    return teamAssignments.filter(assignment => assignment.team_id === teamId && assignment.is_active);
  };


  // Memoize the return value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
    
    // Operations from the operations hook
    ...operations,
    
    // Additional helper functions
    getTeamInventories,
    getTeamAssignments: () => teamAssignments,
    
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
    refreshData: refreshAll,
  }), [
    // Data dependencies
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
    
    // Loading dependencies
    loading,
    itemsLoading,
    transactionsLoading,
    countsLoading,
    alertsLoading,
    templatesLoading,
    categoriesLoading,
    unitsLoading,
    vendorsLoading,
    
    // Operation dependencies
    operations,
    getTeamInventories,
    teamAssignments,
    
    // Refresh function dependencies
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
  ]);

  return contextValue;
};