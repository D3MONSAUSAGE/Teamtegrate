import React from 'react';
import { WarehouseStock } from '../warehouse/WarehouseStock';
import { ReceiveStockDrawer } from '../warehouse/ReceiveStockDrawer';
import { TransferToTeamDrawer } from '../warehouse/TransferToTeamDrawer';

export const WarehouseTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warehouse Management</h2>
          <p className="text-muted-foreground">
            Manage warehouse stock levels, receive inventory, and transfer to teams
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ReceiveStockDrawer />
          <TransferToTeamDrawer />
        </div>
      </div>

      <WarehouseStock />
    </div>
  );
};