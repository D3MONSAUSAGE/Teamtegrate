import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/inventory';
import { InventoryItemDialog } from '../InventoryItemDialog';
import { InventoryAlertsPanel } from '../InventoryAlertsPanel';
import { Package2, Plus, Search, AlertTriangle, TrendingDown, TrendingUp, Edit, Trash } from 'lucide-react';

export const InventoryManagementTab: React.FC = () => {
  const { items, alerts, deleteItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const categories = ['all', ...new Set(items.map(item => item.category).filter(Boolean))];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(item => 
    item.minimum_threshold && item.current_stock <= item.minimum_threshold
  );

  const overstockItems = items.filter(item =>
    item.maximum_threshold && item.current_stock >= item.maximum_threshold
  );

  const handleEditItem = (itemId: string) => {
    setEditingItem(itemId);
    setItemDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const getStockStatus = (item: any) => {
    if (item.minimum_threshold && item.current_stock <= item.minimum_threshold) {
      return { status: 'low', color: 'destructive' as const, icon: TrendingDown };
    }
    if (item.maximum_threshold && item.current_stock >= item.maximum_threshold) {
      return { status: 'high', color: 'warning' as const, icon: TrendingUp };
    }
    return { status: 'normal', color: 'default' as const, icon: Package2 };
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overstock</p>
                <p className="text-2xl font-bold text-amber-600">{overstockItems.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{alerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <InventoryAlertsPanel />
      )}

      {/* Items Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your inventory items, stock levels, and thresholds
              </CardDescription>
            </div>
            <Button onClick={() => setItemDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items by name, description, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const StatusIcon = stockStatus.icon;

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant={stockStatus.color === 'warning' ? 'secondary' : stockStatus.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {stockStatus.status}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Stock: {item.current_stock} {item.unit_of_measure}
                          {item.minimum_threshold && ` • Min: ${item.minimum_threshold}`}
                          {item.maximum_threshold && ` • Max: ${item.maximum_threshold}`}
                          {item.location && ` • Location: ${item.location}`}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.unit_cost && (
                          <span className="text-sm font-medium">
                            ${item.unit_cost.toFixed(2)}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Dialog */}
      <InventoryItemDialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          setItemDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
        itemId={editingItem}
      />
    </div>
  );
};