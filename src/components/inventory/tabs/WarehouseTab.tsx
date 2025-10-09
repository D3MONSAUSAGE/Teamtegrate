import React, { useState, useEffect, useCallback } from 'react';
import { WarehouseStock } from '../warehouse/WarehouseStock';
import { SimpleCheckout } from '../warehouse/SimpleCheckout';
import { ReceiveStockDialog } from '../warehouse/ReceiveStockDialog';
import { WarehouseSettingsTab } from '../warehouse/WarehouseSettingsTab';

import { ProcessingTab } from '../warehouse/ProcessingTab';
import { OutgoingTab } from '../warehouse/OutgoingTab';
import { ReportsTab } from '../warehouse/ReportsTab';
import { WarehouseInvoicesTab } from '../warehouse/tabs/WarehouseInvoicesTab';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Minus, ShoppingCart, Plus, Settings } from 'lucide-react';
import { UnifiedTeamSelector } from '@/components/teams/UnifiedTeamSelector';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useAuth } from '@/contexts/AuthContext';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { useInventory } from '@/contexts/inventory';
import { InvoiceClient } from '@/types/invoices';
import { toast } from 'sonner';
import { WarehouseProvider } from '@/contexts/warehouse/WarehouseContext';

// Lazy load the dashboard component to avoid circular dependencies
const WarehouseOverviewDashboard = React.lazy(() => 
  import('../warehouse/WarehouseOverviewDashboard').then(module => ({
    default: module.WarehouseOverviewDashboard
  }))
);

export const WarehouseTab: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, availableTeams } = useTeamAccess();
  const { items: inventoryItems, getItemById, createTransaction, refreshTransactions } = useInventory();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('stock');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  // Simple warehouse loading - no retries, no loops
  useEffect(() => {
    const loadWarehouse = async () => {
      // Admin with no team selected → show overview
      if ((isAdmin || isSuperAdmin) && !selectedTeamId) {
        setShowOverview(true);
        setWarehouse(null);
        setLoading(false);
        return;
      }

      // Get team ID (selected or user's team)
      const teamId = selectedTeamId || availableTeams[0]?.id;
      if (!teamId) {
        setError('No team assigned');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Simple query - warehouse auto-created by trigger
        const data = await warehouseApi.getWarehouseByTeam(teamId);
        
        if (!data) {
          setError('Warehouse not found. Please contact administrator.');
        } else {
          setWarehouse(data);
          setShowOverview(false);
        }
      } catch (err) {
        console.error('Error loading warehouse:', err);
        setError('Failed to load warehouse');
      } finally {
        setLoading(false);
      }
    };

    loadWarehouse();
  }, [selectedTeamId, isAdmin, isSuperAdmin, availableTeams]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 Refreshing warehouse data...');
    setRefreshKey(prev => prev + 1);
    
    // Trigger additional refresh after a short delay to catch database propagation
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  }, []);

  // Handle items withdrawn from warehouse
  const handleItemsWithdrawn = async (lineItems: any[], reason: string, customerInfo?: any, notes?: string) => {
    try {
      for (const lineItem of lineItems) {
        const inventoryItem = await getItemById(lineItem.item.id);
        if (!inventoryItem) {
          throw new Error(`Item ${lineItem.item.name} not found in inventory`);
        }

        await createTransaction({
          item_id: inventoryItem.id,
          organization_id: inventoryItem.organization_id,
          transaction_type: 'out',
          quantity: -lineItem.quantity,
          unit_cost: lineItem.unitPrice,
          reference_number: `WH-${Date.now()}`,
          notes: notes || `${reason.charAt(0).toUpperCase() + reason.slice(1)} - ${lineItem.item.name}`,
          user_id: user?.id || '',
          transaction_date: new Date().toISOString()
        });
      }

      // Refresh both warehouse and transaction data
      handleRefresh();
      await refreshTransactions();
      
      toast.success(`Successfully withdrew ${lineItems.length} item${lineItems.length !== 1 ? 's' : ''} and logged transactions`);
    } catch (error) {
      console.error('❌ Failed to withdraw items:', error);
      toast.error(`Failed to create transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Handle barcode scanning
  const handleScanItem = async (barcode: string) => {
    try {
      const item = inventoryItems.find(item => item.barcode === barcode || item.sku === barcode);
      return item || null;
    } catch (error) {
      console.error('Error scanning item:', error);
      return null;
    }
  };

  // Handle invoice creation for sales
  const handleCreateInvoice = async (client: InvoiceClient, lineItems: any[], notes?: string) => {
    try {
      const { invoiceService } = await import('@/services/invoiceService');
      return await invoiceService.createInvoice({
        client,
        lineItems: lineItems.map(item => ({
          description: item.item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalCost
        })),
        notes
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const handleSelectWarehouse = (teamId: string | null) => {
    console.log('handleSelectWarehouse called with teamId:', teamId);
    if (teamId) {
      console.log('Setting selected team to:', teamId);
      setSelectedTeamId(teamId);
      setShowOverview(false);
    }
  };

  const tabs = [
    { id: 'stock', label: 'Warehouse Stock' },
    { id: 'processing', label: 'Processing' },
    { id: 'outgoing', label: 'Outgoing' },
    { id: 'reports', label: 'Reports' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'settings', label: 'Settings' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stock':
        return <WarehouseStock key={refreshKey} warehouseId={warehouse.id} onRefresh={handleRefresh} />;
      case 'processing':
        return <ProcessingTab />;
      case 'outgoing':
        return <OutgoingTab 
          warehouseId={warehouse.id} 
          onRefresh={handleRefresh}
          isCheckoutOpen={isCheckoutOpen}
          onCheckoutOpenChange={setIsCheckoutOpen}
        />;
      case 'reports':
        return <ReportsTab defaultTeamId={warehouse?.team_id} warehouseId={warehouse.id} />;
      case 'invoices':
        return <WarehouseInvoicesTab warehouseId={warehouse.id} />;
      case 'settings':
        return <WarehouseSettingsTab 
          warehouseId={warehouse.id} 
          onRefresh={handleRefresh} 
        />;
      default:
        return <WarehouseStock key={refreshKey} warehouseId={warehouse.id} onRefresh={handleRefresh} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Team Selector for Admins/Superadmins - Always visible */}
        {(isAdmin || isSuperAdmin) && (
        <div className="flex items-center gap-4">
            <UnifiedTeamSelector
              selectedTeamId={selectedTeamId}
              onTeamChange={(teamId) => {
                console.log('Team selector changed to:', teamId);
                setSelectedTeamId(teamId);
                if (teamId === null) {
                  setShowOverview(true);
                  setWarehouse(null);
                  setLoading(false);
                } else {
                  handleSelectWarehouse(teamId);
                }
              }}
              variant="simple"
              placeholder="Select team warehouse..."
              showAllOption={true}
            />
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {warehouse ? (
                warehouse.team?.name 
                  ? `${warehouse.team.name} Warehouse Stock`
                  : warehouse.name
              ) : (isAdmin || isSuperAdmin) && !selectedTeamId ? (
                'Warehouse Management'
              ) : (
                'Warehouse Stock'
              )}
            </h2>
            <p className="text-muted-foreground">
              {warehouse ? (
                <>Manage {warehouse.name} stock levels{warehouse.team?.name && ` (${warehouse.team.name})`}, receive inventory, and manage outgoing inventory including sales and transfers</>
              ) : (isAdmin || isSuperAdmin) && !selectedTeamId ? (
                <>Select a team to view and manage their warehouse</>
              ) : (
                <>Set up your warehouse to start managing inventory</>
              )}
            </p>
          </div>
          {warehouse && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsReceiveOpen(true)} className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Receive Stock
              </Button>
              <Button onClick={() => setIsCheckoutOpen(true)} className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Start Checkout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content based on state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading warehouse...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-destructive font-medium mb-2">System Error</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </div>
      ) : warehouse ? (
        // Show warehouse content when warehouse is loaded - Single WarehouseProvider
        <WarehouseProvider warehouseId={warehouse.id}>
          
          <ScrollableTabs>
            <ScrollableTabsList>
              {tabs.map((tab) => (
                <ScrollableTabsTrigger
                  key={tab.id}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </ScrollableTabsTrigger>
              ))}
            </ScrollableTabsList>
            
            <div className="mt-4">
              {renderTabContent()}
            </div>
          </ScrollableTabs>
          
          {/* Simple Checkout - inside WarehouseProvider */}
          <SimpleCheckout
            warehouseId={warehouse.id}
            open={isCheckoutOpen}
            onOpenChange={setIsCheckoutOpen}
            onRefresh={() => {
              handleRefresh();
            }}
          />

          {/* Receive Stock Dialog */}
          <ReceiveStockDialog
            open={isReceiveOpen}
            onOpenChange={setIsReceiveOpen}
            warehouseId={warehouse.id}
          />

        </WarehouseProvider>
      ) : showOverview ? (
        // Show warehouse overview for admins
        <React.Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-muted-foreground">Loading overview...</div></div>}>
          <WarehouseOverviewDashboard onSelectWarehouse={handleSelectWarehouse} />
        </React.Suspense>
      ) : null}


    </div>
  );
};