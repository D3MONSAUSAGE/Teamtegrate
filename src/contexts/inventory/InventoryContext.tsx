import React, { createContext, useContext, ReactNode } from 'react';
import { InventoryContextType } from './types';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  console.log('InventoryProvider: Rendering provider');
  const contextValue = useEnhancedInventoryManagement();
  console.log('InventoryProvider: Context value created:', !!contextValue);
  
  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  console.log('useInventory: Hook called');
  const context = useContext(InventoryContext);
  console.log('useInventory: Context found:', !!context);
  if (context === undefined) {
    console.error('useInventory: No context found - throwing error');
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};