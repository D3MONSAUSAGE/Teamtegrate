import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit, Package, Save, X } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { useToast } from '@/hooks/use-toast';
import { InventoryTemplate, InventoryTemplateItem, InventoryItem } from '@/contexts/inventory/types';

interface TemplateEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: InventoryTemplate;
}

interface TemplateItemWithDetails extends InventoryTemplateItem {
  item: InventoryItem;
  isEditing?: boolean;
}

export const TemplateEditDialog: React.FC<TemplateEditDialogProps> = ({
  isOpen,
  onClose,
  template
}) => {
  const { 
    items, 
    templateItems, 
    updateTemplate, 
    updateTemplateItem,
    refreshTemplateItems 
  } = useInventory();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    is_active: template.is_active
  });
  const [editingItems, setEditingItems] = useState<Record<string, boolean>>({});
  const [itemUpdates, setItemUpdates] = useState<Record<string, {
    in_stock_quantity: number;
    minimum_quantity?: number;
    maximum_quantity?: number;
  }>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get template items with item details
  const currentTemplateItems: TemplateItemWithDetails[] = templateItems
    .filter(ti => ti.template_id === template.id)
    .map(templateItem => {
      const item = items.find(i => i.id === templateItem.item_id);
      return {
        ...templateItem,
        item: item!,
      };
    })
    .filter(item => item.item); // Only include items that exist

  useEffect(() => {
    if (isOpen) {
      refreshTemplateItems();
      setFormData({
        name: template.name,
        description: template.description || '',
        is_active: template.is_active
      });
      setEditingItems({});
      setItemUpdates({});
    }
  }, [isOpen, template, refreshTemplateItems]);

  const handleSaveTemplate = async () => {
    setIsLoading(true);
    try {
      await updateTemplate(template.id, formData);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (itemId: string) => {
    const templateItem = currentTemplateItems.find(ti => ti.item_id === itemId);
    if (templateItem) {
      setEditingItems(prev => ({ ...prev, [itemId]: true }));
      setItemUpdates(prev => ({
        ...prev,
        [itemId]: {
          in_stock_quantity: templateItem.in_stock_quantity || 0,
          minimum_quantity: templateItem.minimum_quantity || undefined,
          maximum_quantity: templateItem.maximum_quantity || undefined,
        }
      }));
    }
  };

  const handleSaveItem = async (itemId: string) => {
    const updates = itemUpdates[itemId];
    if (!updates) return;

    setIsLoading(true);
    try {
      await updateTemplateItem(template.id, itemId, updates);
      setEditingItems(prev => ({ ...prev, [itemId]: false }));
      toast({
        title: "Success",
        description: "Template item updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingItems(prev => ({ ...prev, [itemId]: false }));
    const { [itemId]: _, ...rest } = itemUpdates;
    setItemUpdates(rest);
  };

  const handleItemUpdate = (itemId: string, field: string, value: number | undefined) => {
    setItemUpdates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Template: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Template description..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <Separator />

              <Button
                onClick={handleSaveTemplate}
                disabled={isLoading || !formData.name.trim()}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </CardContent>
          </Card>

          {/* Template Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Template Items ({currentTemplateItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentTemplateItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No items in this template</div>
                  </div>
                ) : (
                  currentTemplateItems.map((templateItem) => {
                    const isEditing = editingItems[templateItem.item_id];
                    const updates = itemUpdates[templateItem.item_id];

                    return (
                      <Card key={templateItem.id} className="border">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{templateItem.item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  SKU: {templateItem.item.sku || 'N/A'}
                                </div>
                              </div>
                              <Badge variant="outline">
                                Stock: {templateItem.item.current_stock}
                              </Badge>
                            </div>

                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                     <Label className="text-xs">In-Stock</Label>
                                     <Input
                                       type="number"
                                       min="0"
                                       value={updates?.in_stock_quantity || 0}
                                       onChange={(e) => handleItemUpdate(
                                         templateItem.item_id, 
                                         'in_stock_quantity', 
                                         Number(e.target.value)
                                       )}
                                       className="h-8"
                                     />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Min</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={updates?.minimum_quantity || ''}
                                      onChange={(e) => handleItemUpdate(
                                        templateItem.item_id, 
                                        'minimum_quantity', 
                                        e.target.value ? Number(e.target.value) : undefined
                                      )}
                                      placeholder="Optional"
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Max</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={updates?.maximum_quantity || ''}
                                      onChange={(e) => handleItemUpdate(
                                        templateItem.item_id, 
                                        'maximum_quantity', 
                                        e.target.value ? Number(e.target.value) : undefined
                                      )}
                                      placeholder="Optional"
                                      className="h-8"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveItem(templateItem.item_id)}
                                    disabled={isLoading}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelEdit(templateItem.item_id)}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                 <div className="text-sm space-y-1">
                                   <div>In-Stock: <span className="font-medium">{templateItem.in_stock_quantity || 0}</span></div>
                                   <div className="text-xs text-muted-foreground">
                                     Min: {templateItem.minimum_quantity ?? 'Not set'} • 
                                     Max: {templateItem.maximum_quantity ?? 'Not set'}
                                   </div>
                                 </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditItem(templateItem.item_id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};