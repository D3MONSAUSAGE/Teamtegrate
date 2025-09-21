import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/inventory';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCountItem } from '@/contexts/inventory/types';
import { Package, Play, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const InventoryCountTab: React.FC = () => {
  const { items, counts, startInventoryCount, updateCountItem, completeInventoryCount } = useInventory();
  const { toast } = useToast();
  
  const [activeCount, setActiveCount] = useState<string | null>(null);
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCountItems, setLoadingCountItems] = useState(false);

  const activeCountRecord = counts.find(c => c.id === activeCount && c.status === 'in_progress');
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartCount = async () => {
    try {
      const count = await startInventoryCount('Manual inventory count');
      setActiveCount(count.id);
      await loadCountItems(count.id);
    } catch (error) {
      console.error('Failed to start count:', error);
    }
  };

  const loadCountItems = async (countId: string) => {
    setLoadingCountItems(true);
    try {
      const items = await inventoryCountsApi.getCountItems(countId);
      setCountItems(items);
    } catch (error) {
      console.error('Failed to load count items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load count items',
        variant: 'destructive',
      });
    } finally {
      setLoadingCountItems(false);
    }
  };

  const handleUpdateCount = async (itemId: string, actualQuantity: number) => {
    if (!activeCount) return;
    
    try {
      await updateCountItem(activeCount, itemId, actualQuantity);
      // Update local state
      setCountItems(prev => prev.map(item => 
        item.item_id === itemId 
          ? { ...item, actual_quantity: actualQuantity }
          : item
      ));
    } catch (error) {
      console.error('Failed to update count:', error);
    }
  };

  const handleCompleteCount = async () => {
    if (!activeCount) return;
    
    try {
      await completeInventoryCount(activeCount);
      setActiveCount(null);
      setCountItems([]);
      toast({
        title: 'Success',
        description: 'Inventory count completed successfully',
      });
    } catch (error) {
      console.error('Failed to complete count:', error);
    }
  };

  useEffect(() => {
    // Check if there's an active count on load
    const inProgressCount = counts.find(c => c.status === 'in_progress');
    if (inProgressCount) {
      setActiveCount(inProgressCount.id);
      loadCountItems(inProgressCount.id);
    }
  }, [counts]);

  if (!activeCount) {
    return (
      <div className="space-y-6">
        {/* Recent Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Inventory Counts
            </CardTitle>
            <CardDescription>
              View recent inventory counts and start a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {counts.slice(0, 5).map((count) => (
                <div key={count.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Count from {new Date(count.count_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {count.notes || 'No notes provided'}
                    </p>
                  </div>
                  <Badge variant={count.status === 'completed' ? 'default' : 'secondary'}>
                    {count.status === 'completed' ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
              ))}
              
              {counts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory counts yet</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button onClick={handleStartCount} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start New Inventory Count
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedItems = countItems.filter(item => item.actual_quantity !== null).length;
  const totalItems = countItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Count Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Active Inventory Count
            </span>
            <Badge variant="secondary">In Progress</Badge>
          </CardTitle>
          <CardDescription>
            Count started on {new Date(activeCountRecord?.count_date || '').toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedItems} of {totalItems} items counted
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button 
                onClick={handleCompleteCount}
                disabled={completedItems === 0}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Count
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Items */}
      <Card>
        <CardHeader>
          <CardTitle>Count Items</CardTitle>
          <CardDescription>
            Enter actual quantities for each item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, category, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loadingCountItems ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const countItem = countItems.find(ci => ci.item_id === item.id);
                  const expectedQty = countItem?.expected_quantity || item.current_stock;
                  const actualQty = countItem?.actual_quantity;
                  const variance = actualQty !== null && actualQty !== undefined 
                    ? actualQty - expectedQty 
                    : null;

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {variance !== null && variance !== 0 && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expected: {expectedQty} {item.unit_of_measure}
                          {item.location && ` • Location: ${item.location}`}
                        </p>
                        {variance !== null && (
                          <p className={`text-sm ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            Variance: {variance > 0 ? '+' : ''}{variance}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Actual qty"
                          value={actualQty ?? ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            if (value !== null) {
                              handleUpdateCount(item.id, value);
                            }
                          }}
                          className="w-24"
                          step="0.01"
                        />
                        <span className="text-sm text-muted-foreground min-w-0">
                          {item.unit_of_measure}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};