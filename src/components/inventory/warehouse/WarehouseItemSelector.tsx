import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Plus, X, Package } from 'lucide-react';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';

interface SelectedItem {
  itemId: string;
  name: string;
  sku?: string;
  qty: number;
  unitCost: number;
}

interface WarehouseItemSelectorProps {
  selectedItems: SelectedItem[];
  onSelectionChange: (items: SelectedItem[]) => void;
}

export const WarehouseItemSelector: React.FC<WarehouseItemSelectorProps> = ({
  selectedItems,
  onSelectionChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchItems = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        setLoading(true);
        const results = await warehouseApi.searchInventoryItems(searchQuery, 10);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching items:', error);
        toast.error('Failed to search items');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleAddItem = (item: any) => {
    const existingItem = selectedItems.find(si => si.itemId === item.id);
    if (existingItem) {
      toast.error('Item already added');
      return;
    }

    const newItem: SelectedItem = {
      itemId: item.id,
      name: item.name,
      sku: item.sku,
      qty: 1,
      unitCost: item.unit_cost || 0
    };

    onSelectionChange([...selectedItems, newItem]);
    setSearchQuery('');
    setShowResults(false);
    toast.success(`Added ${item.name}`);
  };

  const handleRemoveItem = (itemId: string) => {
    onSelectionChange(selectedItems.filter(item => item.itemId !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: 'qty' | 'unitCost', value: number) => {
    onSelectionChange(selectedItems.map(item =>
      item.itemId === itemId ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Label htmlFor="item-search">Search Master Inventory</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="item-search"
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-muted-foreground">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground">No items found</div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                  onClick={() => handleAddItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.sku && <span>SKU: {item.sku}</span>}
                        {item.category?.name && <span className="ml-2">• {item.category.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.unit_cost > 0 && (
                        <Badge variant="secondary">${item.unit_cost}</Badge>
                      )}
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div>
          <Label>Selected Items ({selectedItems.length})</Label>
          <div className="mt-2 space-y-3">
            {selectedItems.map((item) => (
              <div key={item.itemId} className="p-3 border border-border rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.sku && (
                      <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(item.itemId, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Unit Cost</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => handleUpdateItem(item.itemId, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-24 text-sm"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.itemId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>Total Items:</strong> {selectedItems.length} • 
              <strong className="ml-2">Total Value:</strong> ${selectedItems.reduce((sum, item) => sum + (item.qty * item.unitCost), 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {selectedItems.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Search and add items from your master inventory list</p>
        </div>
      )}
    </div>
  );
};