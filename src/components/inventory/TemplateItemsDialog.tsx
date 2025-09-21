import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, X, Package, ArrowRight } from 'lucide-react';
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
  const { items, getTemplateItems, addItemToTemplate, removeItemFromTemplate } = useInventory();
  const { toast } = useToast();
  
  const [templateItems, setTemplateItems] = useState<InventoryTemplateItem[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [expectedQuantity, setExpectedQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && templateId) {
      loadTemplateItems();
    }
  }, [isOpen, templateId]);

  useEffect(() => {
    // Filter available items (exclude those already in template)
    const templateItemIds = templateItems.map(ti => ti.item_id);
    const filtered = items.filter(item => 
      !templateItemIds.includes(item.id) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setAvailableItems(filtered);
  }, [items, templateItems, searchTerm]);

  const loadTemplateItems = async () => {
    try {
      const data = await getTemplateItems(templateId);
      setTemplateItems(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template items",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem) return;
    
    setIsLoading(true);
    try {
      await addItemToTemplate(templateId, selectedItem.id, expectedQuantity);
      await loadTemplateItems();
      setSelectedItem(null);
      setExpectedQuantity(0);
      toast({
        title: "Success",
        description: "Item added to template",
      });
    } catch (error) {
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
      await loadTemplateItems();
      toast({
        title: "Success",
        description: "Item removed from template",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from template",
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
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Manage Items - {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Available Items Panel */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Available Items</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No items found matching your search' : 'All items are already in this template'}
                </div>
              ) : (
                availableItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {item.sku || 'N/A'} | Stock: {item.current_stock}
                          </div>
                        </div>
                        {item.category && (
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Add Item Section */}
            {selectedItem && (
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">Add: {selectedItem.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="expected-qty">Expected Quantity</Label>
                      <Input
                        id="expected-qty"
                        type="number"
                        min="0"
                        value={expectedQuantity}
                        onChange={(e) => setExpectedQuantity(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddItem}
                        disabled={isLoading}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="hidden lg:block" />

          {/* Template Items Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Template Items ({templateItems.length})</h3>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {templateItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items in this template yet
                </div>
              ) : (
                templateItems.map((templateItem) => {
                  const itemDetails = getItemDetails(templateItem.item_id);
                  if (!itemDetails) return null;

                  return (
                    <Card key={templateItem.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{itemDetails.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Expected: {templateItem.expected_quantity} | Current Stock: {itemDetails.current_stock}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(templateItem.item_id)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};