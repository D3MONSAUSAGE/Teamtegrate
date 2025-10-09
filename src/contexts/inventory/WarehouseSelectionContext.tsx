import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';

interface WarehouseSelectionContextType {
  selectedTeamId: string | null;
  selectedWarehouse: Warehouse | null;
  setSelectedTeamId: (teamId: string | null) => void;
  isAdminView: boolean;
  isLoading: boolean;
}

const WarehouseSelectionContext = createContext<WarehouseSelectionContextType | undefined>(undefined);

interface WarehouseSelectionProviderProps {
  children: ReactNode;
}

export const WarehouseSelectionProvider: React.FC<WarehouseSelectionProviderProps> = ({ children }) => {
  const { isAdmin, isSuperAdmin, availableTeams } = useTeamAccess();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdminView = (isAdmin || isSuperAdmin) && selectedTeamId === null;

  // Load warehouse when team selection changes
  useEffect(() => {
    const loadWarehouse = async () => {
      if (!selectedTeamId) {
        setSelectedWarehouse(null);
        return;
      }

      try {
        setIsLoading(true);
        const warehouse = await warehouseApi.getWarehouseByTeam(selectedTeamId);
        setSelectedWarehouse(warehouse);
      } catch (error) {
        console.error('Error loading warehouse:', error);
        setSelectedWarehouse(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadWarehouse();
  }, [selectedTeamId]);

  // Auto-select team for non-admin users
  useEffect(() => {
    if (!isAdmin && !isSuperAdmin && availableTeams.length > 0 && selectedTeamId === null) {
      setSelectedTeamId(availableTeams[0].id);
    }
  }, [isAdmin, isSuperAdmin, availableTeams, selectedTeamId]);

  const value: WarehouseSelectionContextType = {
    selectedTeamId,
    selectedWarehouse,
    setSelectedTeamId,
    isAdminView,
    isLoading,
  };

  return (
    <WarehouseSelectionContext.Provider value={value}>
      {children}
    </WarehouseSelectionContext.Provider>
  );
};

export const useWarehouseSelection = (): WarehouseSelectionContextType => {
  const context = useContext(WarehouseSelectionContext);
  if (context === undefined) {
    throw new Error('useWarehouseSelection must be used within a WarehouseSelectionProvider');
  }
  return context;
};
