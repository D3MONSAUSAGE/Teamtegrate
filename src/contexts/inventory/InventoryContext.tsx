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
  
  // Don't provide context if user doesn't have organization access
  if (!shouldInitialize) {
    return (
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
    );
  }
  
  // Only call the hook when we should initialize
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