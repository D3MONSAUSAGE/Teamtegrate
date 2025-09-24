import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, X, Package, ArrowRight, ShoppingCart, Edit, Check, XCircle } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, InventoryTemplateItem } from '@/contexts/inventory/types';

interface TemplateItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
}

export const TemplateItemsDialog: React.FC<TemplateItemsDialogProps> = ({
  isOpen,
  onClose,
  templateId,
  templateName
}) => {
  const { items, templateItems, addItemToTemplate, removeItemFromTemplate, refreshTemplateItems, updateTemplateItem } = useInventory();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inStockQuantity, setInStockQuantity] = useState<number>(0);
  const [minimumQuantity, setMinimumQuantity] = useState<number | undefined>(undefined);
  const [maximumQuantity, setMaximumQuantity] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    inStock: number;
    minimum: number | undefined;
    maximum: number | undefined;
  }>({
    inStock: 0,
    minimum: undefined,
    maximum: undefined
  });

  // Get template items for this specific template from global state
  const currentTemplateItems = useMemo(() => {
    return templateItems.filter(ti => ti.template_id === templateId);
  }, [templateItems, templateId]);

  // Filter available items (exclude those already in template)
  const availableItems = useMemo(() => {
    const templateItemIds = currentTemplateItems.map(ti => ti.item_id);
    return items.filter(item => 
      !templateItemIds.includes(item.id) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, currentTemplateItems, searchTerm]);

  // Refresh template items when dialog opens
  useEffect(() => {
    if (isOpen && templateId) {
      refreshTemplateItems();
    }
  }, [isOpen, templateId, refreshTemplateItems]);

  const handleAddItem = async () => {
    if (!selectedItem) return;
    
    // Validate quantities before adding
    const validatedMin = minimumQuantity && minimumQuantity >= 0 ? minimumQuantity : undefined;
    const validatedMax = maximumQuantity && maximumQuantity >= 0 ? maximumQuantity : undefined;
    const validatedInStock = Math.max(0, inStockQuantity || 0);
    
    // Check min <= max constraint
    if (validatedMin !== undefined && validatedMax !== undefined && validatedMin > validatedMax) {
      toast({
        title: "Invalid Quantities",
        description: "Minimum quantity cannot be greater than maximum quantity",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await addItemToTemplate(templateId, selectedItem.id, validatedInStock, validatedMin, validatedMax);
      // Force refresh of template items to ensure UI updates
      await refreshTemplateItems();
      setSelectedItem(null);
      setInStockQuantity(0);
      setMinimumQuantity(undefined);
      setMaximumQuantity(undefined);
      toast({
        title: "Success",
        description: "Item added to template",
      });
    } catch (error) {
      console.error('Error adding item to template:', error);
      toast({
        title: "Error",
        description: "Failed to add item to template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (item: InventoryItem) => {
    setIsLoading(true);
    try {
      await addItemToTemplate(templateId, item.id, 0);
      // Force refresh of template items to ensure UI updates
      await refreshTemplateItems();
      toast({
        title: "Success",
        description: `${item.name} added to template`,
      });
    } catch (error) {
      console.error('Error in quick add:', error);
      toast({
        title: "Error",
        description: "Failed to add item to template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      await removeItemFromTemplate(templateId, itemId);
      // Force refresh of template items to ensure UI updates
      await refreshTemplateItems();
      toast({
        title: "Success",
        description: "Item removed from template",
      });
    } catch (error) {
      console.error('Error removing item from template:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (templateItem: InventoryTemplateItem) => {
    setEditingItem(templateItem.id);
    setEditValues({
      inStock: templateItem.in_stock_quantity,
      minimum: templateItem.minimum_quantity ?? undefined,
      maximum: templateItem.maximum_quantity ?? undefined
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({
      inStock: 0,
      minimum: undefined,
      maximum: undefined
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    // Find the template item being edited
    const templateItem = currentTemplateItems.find(ti => ti.id === editingItem);
    if (!templateItem) return;
    
    // Validate quantities before saving
    const validatedMin = editValues.minimum && editValues.minimum >= 0 ? editValues.minimum : null;
    const validatedMax = editValues.maximum && editValues.maximum >= 0 ? editValues.maximum : null;
    const validatedInStock = Math.max(0, editValues.inStock || 0);
    
    // Check min <= max constraint
    if (validatedMin !== null && validatedMax !== null && validatedMin > validatedMax) {
      toast({
        title: "Invalid Quantities",
        description: "Minimum quantity cannot be greater than maximum quantity",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await updateTemplateItem(templateId, templateItem.item_id, {
        in_stock_quantity: validatedInStock,
        minimum_quantity: validatedMin,
        maximum_quantity: validatedMax
      });
      await refreshTemplateItems();
      handleCancelEdit();
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      console.error('Error updating template item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getItemDetails = (itemId: string): InventoryItem | undefined => {
    return items.find(item => item.id === itemId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Manage Items - {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 overflow-hidden">
          {/* Available Items Panel - Enhanced */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Available Items</h3>
              <Badge variant="outline" className="text-sm">
                {availableItems.length} items
              </Badge>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="text-lg font-medium mb-2">
                    {searchTerm ? 'No items found' : 'All items added'}
                  </div>
                  <div className="text-sm">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'All available items are already in this template'}
                  </div>
                </div>
              ) : (
                availableItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedItem?.id === item.id 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{item.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">SKU:</span> {item.sku || 'N/A'} • 
                            <span className="font-medium"> Stock:</span> {item.current_stock}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.category && (
                            <Badge variant="secondary" className="text-xs">
                              {item.category.name}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(item);
                            }}
                            disabled={isLoading}
                            className="ml-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Add Item Section - Enhanced */}
            {selectedItem && (
              <div className="border-t pt-4 bg-muted/30 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">Add: {selectedItem.name}</span>
                  </div>
                   <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="in-stock-qty" className="text-sm font-medium">
                          In-Stock Quantity
                          <span className="text-xs text-muted-foreground block">Current expected stock</span>
                        </Label>
                        <Input
                          id="in-stock-qty"
                          type="number"
                          min="0"
                          value={inStockQuantity}
                          onChange={(e) => setInStockQuantity(Number(e.target.value))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                     <div>
                       <Label htmlFor="min-qty" className="text-sm font-medium">
                         Min Quantity (Optional)
                         <span className="text-xs text-muted-foreground block">Reorder threshold</span>
                       </Label>
                       <Input
                         id="min-qty"
                         type="number"
                         min="0"
                         value={minimumQuantity || ''}
                         onChange={(e) => setMinimumQuantity(e.target.value ? Number(e.target.value) : undefined)}
                         placeholder="Optional"
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label htmlFor="max-qty" className="text-sm font-medium">
                         Max Quantity (Optional)
                         <span className="text-xs text-muted-foreground block">Maximum stock level</span>
                       </Label>
                       <Input
                         id="max-qty"
                         type="number"
                         min="0"
                         value={maximumQuantity || ''}
                         onChange={(e) => setMaximumQuantity(e.target.value ? Number(e.target.value) : undefined)}
                         placeholder="Optional"
                         className="mt-1"
                       />
                     </div>
                   </div>
                   <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded mt-2">
                     <strong>Tip:</strong> For new stores, you can set in-stock to 0 and define min/max quantities for future inventory planning.
                   </div>
                  <div className="mt-3">
                    <Button
                      onClick={handleAddItem}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Template
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Template Items Panel - Enhanced */}
          <div className="space-y-4 border-l pl-6 bg-primary/5 -mr-6 pr-6 py-4 rounded-l-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Template Items</h3>
              </div>
              <Badge variant="default" className="text-sm">
                {currentTemplateItems.length} items
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Items in this template will be used for inventory counts and assignments.
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentTemplateItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="text-lg font-medium mb-2">No items yet</div>
                  <div className="text-sm">
                    Add items from the left panel to build your template
                  </div>
                </div>
              ) : (
                currentTemplateItems.map((templateItem) => {
                  const itemDetails = getItemDetails(templateItem.item_id);
                  if (!itemDetails) return null;
                  
                  const isEditing = editingItem === templateItem.id;

                  return (
                    <Card key={templateItem.id} className="border-2">
                      <CardContent className="p-4">
                        {isEditing ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <div className="font-medium text-lg">{itemDetails.name}</div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">In-Stock</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editValues.inStock}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    inStock: Number(e.target.value)
                                  }))}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Min</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editValues.minimum || ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    minimum: e.target.value ? Number(e.target.value) : undefined
                                  }))}
                                  placeholder="Optional"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Max</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editValues.maximum || ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    maximum: e.target.value ? Number(e.target.value) : undefined
                                  }))}
                                  placeholder="Optional"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={isLoading}
                                className="h-7 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isLoading}
                                className="h-7 text-xs"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-lg">{itemDetails.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">In-Stock:</span> {templateItem.in_stock_quantity} • 
                                <span className="font-medium"> Current Stock:</span> {itemDetails.current_stock}
                              </div>
                              {(templateItem.minimum_quantity != null || templateItem.maximum_quantity != null) && (
                                <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                  <span>
                                    <span className="font-medium">Min:</span> {templateItem.minimum_quantity ?? 'Not set'}
                                  </span>
                                  <span>
                                    <span className="font-medium">Max:</span> {templateItem.maximum_quantity ?? 'Not set'}
                                  </span>
                                </div>
                              )}
                              {templateItem.minimum_quantity == null && templateItem.maximum_quantity == null && (
                                <div className="text-xs text-orange-600 mt-1">
                                  Min/Max quantities not set
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(templateItem)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="Edit quantities"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(templateItem.item_id)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Remove from template"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};