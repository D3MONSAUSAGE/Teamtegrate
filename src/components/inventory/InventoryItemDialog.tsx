import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/contexts/inventory';
import { Textarea } from '@/components/ui/textarea';
import { Package, Calculator, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { InventoryCategoryDialog } from './InventoryCategoryDialog';
import { InventoryUnitDialog } from './InventoryUnitDialog';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  base_unit_id: z.string().optional(),
  purchase_unit: z.string().optional(),
  conversion_factor: z.coerce.number().positive('Package size must be greater than 0').optional(),
  purchase_price: z.coerce.number().min(0, 'Package price must be 0 or greater').optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  location: z.string().optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string | null;
}

export const InventoryItemDialog: React.FC<InventoryItemDialogProps> = ({
  open,
  onOpenChange,
  itemId
}) => {
  const { createItem, updateItem, getItemById, loading, categories, units } = useInventory();
  
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      base_unit_id: '',
      purchase_unit: '',
      conversion_factor: undefined,
      purchase_price: undefined,
      sku: '',
      barcode: '',
      location: '',
    },
  });

  const watchedValues = form.watch(['conversion_factor', 'purchase_price']);

  useEffect(() => {
    const [conversion, price] = watchedValues;
    if (conversion && price && conversion > 0) {
      setCalculatedUnitPrice(price / conversion);
    } else {
      setCalculatedUnitPrice(null);
    }
  }, [watchedValues]);

  useEffect(() => {
    if (itemId && open) {
      loadItem();
    } else if (open) {
      form.reset();
      setCalculatedUnitPrice(null);
    }
  }, [itemId, open]);

  const loadItem = async () => {
    try {
      const item = await getItemById(itemId!);
      if (item) {
        form.reset({
          name: item.name,
          description: item.description || '',
          category_id: item.category_id || '',
          base_unit_id: item.base_unit_id || '',
          purchase_unit: item.purchase_unit || '',
          conversion_factor: item.conversion_factor || undefined,
          purchase_price: item.purchase_price || undefined,
          sku: item.sku || '',
          barcode: item.barcode || '',
          location: item.location || '',
        });
      }
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Failed to load item details');
    }
  };

  const onSubmit = async (values: InventoryItemFormData) => {
    try {
      const itemData = {
        name: values.name || '',
        description: values.description,
        category_id: values.category_id,
        base_unit_id: values.base_unit_id,
        purchase_unit: values.purchase_unit,
        conversion_factor: values.conversion_factor,
        purchase_price: values.purchase_price,
        sku: values.sku,
        barcode: values.barcode,
        current_stock: 0, // Default to 0 for master items
        minimum_threshold: null,
        maximum_threshold: null,
        reorder_point: null,
        unit_cost: calculatedUnitPrice || null, // Use calculated price instead of manual
        location: values.location,
        is_active: true,
        is_template: false,
        sort_order: 0,
      };

      if (itemId) {
        await updateItem(itemId, itemData);
        toast.success('Item updated successfully');
      } else {
        await createItem(itemData);
        toast.success('Item created successfully');
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {itemId ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter item description" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Item Type and Units */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        <div className="border-t">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => setIsCategoryDialogOpen(true)}
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Create New Item Type
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Individual Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="What is each item?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.filter(unit => unit.unit_type === 'count' || unit.unit_type === 'weight' || unit.unit_type === 'volume').map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                        <div className="border-t">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => setIsUnitDialogOpen(true)}
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Create New Unit
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Package Information */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="flex items-center gap-2 font-medium text-sm">
                <Package className="h-4 w-4" />
                How do you buy this item?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How is it packaged?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.filter(unit => unit.unit_type === 'count').map((unit) => (
                            <SelectItem key={unit.id} value={unit.name.toLowerCase()}>
                              {unit.name}
                            </SelectItem>
                          ))}
                          <div className="border-t">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs h-8"
                              onClick={() => setIsUnitDialogOpen(true)}
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Create New Package Type
                            </Button>
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conversion_factor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Size</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001"
                          placeholder="e.g., 12 (items per package)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="e.g., 24.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {calculatedUnitPrice !== null && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Cost Calculation</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ${calculatedUnitPrice.toFixed(4)} per item
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is what each individual item costs based on your package pricing
                  </p>
                </div>
              )}
            </div>

            {/* Storage Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Warehouse A, Shelf 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : itemId ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </form>
        </Form>

        <InventoryCategoryDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
        />

        <InventoryUnitDialog
          open={isUnitDialogOpen}
          onOpenChange={setIsUnitDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
};