import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TruckIcon, ShoppingCart, Plus, Package, BarChart3 } from 'lucide-react';
import { OutgoingSheet } from '../OutgoingSheet';
import { warehouseApi, type WarehouseItem } from '@/contexts/warehouse/api/warehouseApi';
import { useInventory } from '@/contexts/inventory';
import { InvoiceClient } from '@/types/invoices';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OutgoingTabProps {
  warehouseId: string;
}

export const OutgoingTab: React.FC<OutgoingTabProps> = ({ warehouseId }) => {
  const { items: inventoryItems, getItemById, createTransaction, refreshTransactions } = useInventory();
  const { user } = useAuth();
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOutgoingSheetOpen, setIsOutgoingSheetOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  useEffect(() => {
    loadWarehouseItems();
  }, [warehouseId]);

  const loadWarehouseItems = async () => {
    try {
      setLoading(true);
      const items = await warehouseApi.listWarehouseItems(warehouseId);
      // Only show items with stock > 0
      const itemsWithStock = items.filter(item => item.on_hand > 0);
      setWarehouseItems(itemsWithStock);
    } catch (error) {
      console.error('Error loading warehouse items:', error);
      toast.error('Failed to load warehouse items');
    } finally {
      setLoading(false);
    }
  };

  // Handle item withdrawal
  const handleItemsWithdrawn = async (lineItems: any[], reason: string, customerInfo?: any, notes?: string) => {
    try {
      console.log('🔄 Creating transactions for withdrawal:', { lineItems, reason, user: user?.id });
      
      if (!user?.id || !user?.organizationId) {
        throw new Error('User authentication required for transactions');
      }
      
      // Process each line item
      for (const lineItem of lineItems) {
        const transactionData = {
          organization_id: user.organizationId,
          team_id: warehouseId, // Link transaction to team/warehouse
          item_id: lineItem.item.id,
          transaction_type: 'out' as const,
          quantity: -lineItem.quantity, // Negative for outbound
          unit_cost: lineItem.unitPrice,
          reference_number: `${reason.toUpperCase()}-${Date.now()}`,
          notes: `${reason}: ${notes || ''}${customerInfo ? ` | Customer: ${customerInfo.name}` : ''}`.trim(),
          user_id: user.id,
          transaction_date: new Date().toISOString()
        };
        
        console.log('🔄 Creating transaction:', transactionData);
        const result = await createTransaction(transactionData);
        console.log('✅ Transaction created:', result);
      }
      
      // Reload warehouse items to reflect changes
      await loadWarehouseItems();
      
      // Refresh transaction data for reports
      await refreshTransactions();
      
      toast.success(`Successfully withdrew ${lineItems.length} item${lineItems.length !== 1 ? 's' : ''} and logged transactions`);
    } catch (error) {
      console.error('❌ Failed to withdraw items:', error);
      toast.error(`Failed to create transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to let OutgoingSheet handle the error toast
    }
  };

  // Handle invoice creation for sales
  const handleCreateInvoice = async (client: InvoiceClient, lineItems: any[], notes?: string) => {
    try {
      const { invoiceService } = await import('@/services/invoiceService');
      
      // Transform line items to match invoice service format
      const formattedLineItems = lineItems.map(item => ({
        description: item.item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));

      // Create the invoice
      const createdInvoice = await invoiceService.createInvoice({
        client,
        lineItems: formattedLineItems,
        notes: `Sale: ${notes || ''}`.trim(),
        payment_terms: 'Net 30',
        tax_rate: 0, // Can be made configurable later
        team_id: warehouseId // Link invoice to team/warehouse
      });

      console.log('Created invoice:', createdInvoice);
      toast.success(`Invoice ${createdInvoice.invoice_number} created for ${client.name}`);
      
      return createdInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
      throw error;
    }
  };
  const handleScanItem = async (barcode: string) => {
    try {
      // Find item by barcode in available inventory items
      const item = inventoryItems.find(item => item.barcode === barcode);
      if (item) {
        return item;
      }
      
      // If not found locally, try to fetch from database
      const foundItem = await getItemById(barcode);
      return foundItem;
    } catch (error) {
      console.error('Failed to scan item:', error);
      return null;
    }
  };

  const totalStockValue = warehouseItems.reduce((sum, item) => {
    return sum + (item.on_hand * item.wac_unit_cost);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for sale
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouseItems.reduce((sum, item) => sum + item.on_hand, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total units available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalStockValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Outgoing & Sales
            </CardTitle>
            <Button onClick={() => setIsOutgoingSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Withdraw/Sell Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : warehouseItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Stock Available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                There are currently no items in warehouse stock. Receive inventory first to enable outgoing operations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {warehouseItems.length} items available for withdrawal or sale
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouseItems.slice(0, 6).map(warehouseItem => (
                  <Card key={warehouseItem.item_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{warehouseItem.item?.name}</h4>
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Stock: {warehouseItem.on_hand}</p>
                        {warehouseItem.item?.sku && <p>SKU: {warehouseItem.item.sku}</p>}
                        <p>Value: ${(warehouseItem.on_hand * warehouseItem.wac_unit_cost).toFixed(2)}</p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedItemId(warehouseItem.item_id);
                          setIsOutgoingSheetOpen(true);
                        }}
                      >
                        Withdraw/Sell
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {warehouseItems.length > 6 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View All Items ({warehouseItems.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outgoing Sheet */}
      <OutgoingSheet
        open={isOutgoingSheetOpen}
        onClose={() => {
          setIsOutgoingSheetOpen(false);
          setSelectedItemId(null);
        }}
        onItemsWithdrawn={handleItemsWithdrawn}
        availableItems={inventoryItems}
        onScanItem={handleScanItem}
        onCreateInvoice={handleCreateInvoice}
      />
    </div>
  );
};