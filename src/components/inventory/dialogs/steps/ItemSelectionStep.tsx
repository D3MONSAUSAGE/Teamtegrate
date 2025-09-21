import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Plus, X, GripVertical } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import type { TemplateFormData } from '../EnhancedTemplateDialog';
import type { InventoryItem } from '@/contexts/inventory/types';

interface ItemSelectionStepProps {
  formData: TemplateFormData;
  updateFormData: (updates: Partial<TemplateFormData>) => void;
}

export const ItemSelectionStep: React.FC<ItemSelectionStepProps> = ({
  formData,
  updateFormData
}) => {
  const { items, categories } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const addItem = (item: InventoryItem) => {
    const isAlreadySelected = formData.selectedItems.some(selected => selected.item.id === item.id);
    if (isAlreadySelected) return;

    const newSelectedItem = {
      item,
      expectedQuantity: 0,
      minimumQuantity: undefined,
      maximumQuantity: undefined,
      sortOrder: formData.selectedItems.length
    };

    updateFormData({
      selectedItems: [...formData.selectedItems, newSelectedItem]
    });
  };

  const removeItem = (itemId: string) => {
    updateFormData({
      selectedItems: formData.selectedItems.filter(selected => selected.item.id !== itemId)
    });
  };

  const updateItemQuantity = (itemId: string, field: 'expectedQuantity' | 'minimumQuantity' | 'maximumQuantity', value: number | undefined) => {
    updateFormData({
      selectedItems: formData.selectedItems.map(selected =>
        selected.item.id === itemId
          ? { ...selected, [field]: field === 'expectedQuantity' ? Math.max(0, value || 0) : value }
          : selected
      )
    });
  };

  const addBulkItems = () => {
    const itemsToAdd = filteredItems
      .filter(item => !formData.selectedItems.some(selected => selected.item.id === item.id))
      .slice(0, 10) // Limit to 10 items at once
      .map((item, index) => ({
        item,
        expectedQuantity: 0,
        minimumQuantity: undefined,
        maximumQuantity: undefined,
        sortOrder: formData.selectedItems.length + index
      }));

    if (itemsToAdd.length > 0) {
      updateFormData({
        selectedItems: [...formData.selectedItems, ...itemsToAdd]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Selected Items Section */}
      {formData.selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Selected Items ({formData.selectedItems.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFormData({ selectedItems: [] })}
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.selectedItems.map((selected, index) => (
                <div
                  key={selected.item.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selected.item.name}</span>
                      {selected.item.sku && (
                        <Badge variant="outline" className="text-xs">
                          {selected.item.sku}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current Stock: {selected.item.current_stock} {selected.item.base_unit?.abbreviation || 'units'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center">
                      <Label htmlFor={`min-${selected.item.id}`} className="text-xs mb-1">
                        Min:
                      </Label>
                      <Input
                        id={`min-${selected.item.id}`}
                        type="number"
                        min="0"
                        value={selected.minimumQuantity || ''}
                        onChange={(e) => updateItemQuantity(selected.item.id, 'minimumQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <Label htmlFor={`exp-${selected.item.id}`} className="text-xs mb-1">
                        Expected:
                      </Label>
                      <Input
                        id={`exp-${selected.item.id}`}
                        type="number"
                        min="0"
                        value={selected.expectedQuantity || ''}
                        onChange={(e) => updateItemQuantity(selected.item.id, 'expectedQuantity', parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <Label htmlFor={`max-${selected.item.id}`} className="text-xs mb-1">
                        Max:
                      </Label>
                      <Input
                        id={`max-${selected.item.id}`}
                        type="number"
                        min="0"
                        value={selected.maximumQuantity || ''}
                        onChange={(e) => updateItemQuantity(selected.item.id, 'maximumQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(selected.item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Add Items to Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search items by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredItems.length > 0 && (
              <Button variant="outline" onClick={addBulkItems}>
                Add Top 10
              </Button>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p>No items found matching your search criteria</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = formData.selectedItems.some(selected => selected.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.sku && (
                          <Badge variant="outline" className="text-xs">
                            {item.sku}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Stock: {item.current_stock} {item.base_unit?.abbreviation || 'units'}</span>
                        {item.minimum_threshold && (
                          <span>Min: {item.minimum_threshold}</span>
                        )}
                        {item.purchase_price && (
                          <span>Price: ${item.purchase_price}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => isSelected ? removeItem(item.id) : addItem(item)}
                    >
                      {isSelected ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Item Selection Tips</h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Set expected quantities to help teams know normal stock levels</li>
                <li>• Use minimum/maximum quantities to define acceptable count ranges</li>
                <li>• Expected quantity is required; min/max are optional for flexibility</li>
                <li>• Use search and category filters to find items quickly</li>
                <li>• Add commonly counted items first for better organization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};