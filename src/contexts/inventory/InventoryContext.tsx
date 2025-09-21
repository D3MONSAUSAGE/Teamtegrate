import React, { createContext, useContext, ReactNode } from 'react';
import { InventoryContextType } from './types';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const inventoryData = useEnhancedInventoryManagement();

  return (
    <InventoryContext.Provider value={inventoryData}>
      {children}
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