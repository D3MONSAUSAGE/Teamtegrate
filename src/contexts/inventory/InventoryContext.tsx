import React, { createContext, useContext, ReactNode } from 'react';
import { InventoryContextType } from './types';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  try {
    const inventoryData = useEnhancedInventoryManagement();
    
    console.log('InventoryProvider - inventoryData:', inventoryData ? 'defined' : 'undefined');
    
    if (!inventoryData) {
      console.error('InventoryProvider - useEnhancedInventoryManagement returned undefined');
      return <div>Loading inventory...</div>;
    }

    return (
      <InventoryContext.Provider value={inventoryData}>
        {children}
      </InventoryContext.Provider>
    );
  } catch (error) {
    console.error('InventoryProvider - Error in useEnhancedInventoryManagement:', error);
    return <div>Error loading inventory: {error.message}</div>;
  }
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};