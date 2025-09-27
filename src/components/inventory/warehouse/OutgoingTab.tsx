import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TruckIcon, ShoppingCart, Plus, Package, BarChart3 } from 'lucide-react';
import { OutgoingDialog } from '../OutgoingDialog';
import { useInventory } from '@/contexts/inventory';

export const OutgoingTab: React.FC = () => {
  const { items } = useInventory();
  const [isOutgoingDialogOpen, setIsOutgoingDialogOpen] = useState(false);
  
  // Get items with stock > 0
  const itemsWithStock = items.filter(item => (item.current_stock || 0) > 0);
  const totalStockValue = itemsWithStock.reduce((sum, item) => {
    return sum + ((item.current_stock || 0) * (item.unit_cost || 0));
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
            <div className="text-2xl font-bold">{itemsWithStock.length}</div>
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
              {itemsWithStock.reduce((sum, item) => sum + (item.current_stock || 0), 0)}
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
            <Button onClick={() => setIsOutgoingDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Withdraw/Sell Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {itemsWithStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Stock Available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                There are currently no items in stock. Receive inventory first to enable outgoing operations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {itemsWithStock.length} items available for withdrawal or sale
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemsWithStock.slice(0, 6).map(item => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Stock: {item.current_stock || 0}</p>
                        {item.sku && <p>SKU: {item.sku}</p>}
                        {item.unit_cost && (
                          <p>Value: ${((item.current_stock || 0) * item.unit_cost).toFixed(2)}</p>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-3"
                        onClick={() => {
                          // TODO: Add selectedItemId to OutgoingDialog
                          setIsOutgoingDialogOpen(true);
                        }}
                      >
                        Withdraw/Sell
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {itemsWithStock.length > 6 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View All Items ({itemsWithStock.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OutgoingDialog
        open={isOutgoingDialogOpen}
        onOpenChange={setIsOutgoingDialogOpen}
      />
    </div>
  );
};