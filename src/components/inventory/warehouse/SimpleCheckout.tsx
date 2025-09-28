import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Trash2, Plus, Minus, ShoppingCart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryTransactionsApi } from '@/contexts/inventory/api/inventoryTransactions';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { useAuth } from '@/contexts/AuthContext';

interface CheckoutItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  availableStock: number;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface SimpleCheckoutProps {
  warehouseId: string;
  onClose: () => void;
}

export const SimpleCheckout: React.FC<SimpleCheckoutProps> = ({ warehouseId, onClose }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CheckoutItem[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load available items when search term changes
  React.useEffect(() => {
    if (searchTerm.length >= 2) {
      loadAvailableItems();
    } else {
      setAvailableItems([]);
    }
  }, [searchTerm]);

  const loadAvailableItems = async () => {
    try {
      setIsLoading(true);
      const warehouseItems = await warehouseApi.listWarehouseItems(warehouseId);
      
      // Filter items based on search and stock availability
      const filtered = warehouseItems
        .filter(item => 
          item.on_hand > 0 && 
          (item.item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.item?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.item?.barcode?.includes(searchTerm))
        )
        .slice(0, 10);
      
      setAvailableItems(filtered);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to search items');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (warehouseItem: any) => {
    const existingItem = cart.find(item => item.id === warehouseItem.item_id);
    
    if (existingItem) {
      // Increase quantity if already in cart
      if (existingItem.quantity < warehouseItem.on_hand) {
        updateQuantity(warehouseItem.item_id, existingItem.quantity + 1);
      } else {
        toast.error(`Cannot add more. Only ${warehouseItem.on_hand} available in stock.`);
      }
    } else {
      // Add new item to cart
      const newItem: CheckoutItem = {
        id: warehouseItem.item_id,
        name: warehouseItem.item?.name || 'Unknown Item',
        sku: warehouseItem.item?.sku,
        barcode: warehouseItem.item?.barcode,
        availableStock: warehouseItem.on_hand,
        unitPrice: warehouseItem.wac_unit_cost || 0,
        quantity: 1,
        total: warehouseItem.wac_unit_cost || 0
      };
      
      setCart(prev => [...prev, newItem]);
      toast.success(`Added ${newItem.name} to cart`);
    }
    
    // Clear search after adding
    setSearchTerm('');
    setAvailableItems([]);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        if (newQuantity > item.availableStock) {
          toast.error(`Cannot exceed available stock of ${item.availableStock}`);
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          total: item.unitPrice * newQuantity
        };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!user?.id || !user?.organizationId) {
      toast.error('User authentication required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Process each cart item
      for (const item of cart) {
        // Update warehouse stock
        await warehouseApi.updateWarehouseStock(warehouseId, item.id, -item.quantity);
        
        // Create transaction record
        const transactionData = {
          organization_id: user.organizationId,
          team_id: warehouseId,
          item_id: item.id,
          transaction_type: 'out' as const,
          quantity: -item.quantity,
          unit_cost: item.unitPrice,
          reference_number: `CHECKOUT-${Date.now()}`,
          notes: `Checkout withdrawal: ${item.name}`,
          user_id: user.id,
          transaction_date: new Date().toISOString()
        };
        
        await inventoryTransactionsApi.create(transactionData);
      }
      
      toast.success(`Successfully checked out ${getTotalItems()} items for $${getTotalAmount().toFixed(2)}`);
      
      // Reset cart and close
      setCart([]);
      onClose();
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Warehouse Checkout
        </h1>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search & Add Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
            
            {availableItems.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableItems.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => addToCart(item)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.item?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {item.on_hand} • ${item.wac_unit_cost?.toFixed(2) || '0.00'}
                        {item.item?.sku && ` • SKU: ${item.item.sku}`}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {searchTerm.length >= 2 && !isLoading && availableItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No items found matching "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </div>
              {cart.length > 0 && (
                <Badge variant="secondary">
                  {getTotalItems()} items
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Search and add items to get started</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ${item.unitPrice.toFixed(2)} each • Stock: {item.availableStock}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-sm font-medium w-16 text-right">
                        ${item.total.toFixed(2)}
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Cart Total */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : `Checkout ${getTotalItems()} Items`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};