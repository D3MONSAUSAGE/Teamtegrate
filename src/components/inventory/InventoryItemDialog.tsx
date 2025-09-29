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
import { Package, Calculator, Plus, Scan, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { InventoryCategoryDialog } from './InventoryCategoryDialog';
import { InventoryUnitDialog } from './InventoryUnitDialog';
import { SKUGeneratorButton, SKUValidationIndicator } from './SKUGeneratorButton';
import { validateSKUUniqueness } from '@/utils/skuGenerator';
import { BarcodeInput } from './BarcodeInput';
import { TeamInventorySelector } from './TeamInventorySelector';
import { VendorSelector } from './VendorSelector';
import { VendorDialog } from './dialogs/VendorDialog';
import { ImageUpload } from './ImageUpload';
import { vendorsApi } from '@/contexts/inventory/api';
import { useAuth } from '@/contexts/AuthContext';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  base_unit_id: z.string().optional(),
  purchase_unit: z.string().optional(),
  conversion_factor: z.coerce.number().positive('Units per package must be greater than 0').optional(),
  purchase_price: z.coerce.number().min(0, 'Package price must be 0 or greater').optional(),
  sale_price: z.coerce.number().min(0, 'Sale price must be 0 or greater').optional(),
  vendor_id: z.string().nullable().optional(),
  sku: z.string().optional().refine(async (sku) => {
    if (!sku || sku.trim() === '') return true;
    return true;
  }, 'SKU validation failed'),
  barcode: z.string().optional(),
  location: z.string().optional(),
  team_id: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
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
  const { createItem, updateItem, getItemById, loading, categories, units, vendors, refreshVendors } = useInventory();
  const { user } = useAuth();
  
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

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
      sale_price: undefined,
      sku: '',
      barcode: '',
      location: '',
      team_id: null,
      vendor_id: null,
      image_url: null,
    },
  });

  const watchedValues = form.watch(['conversion_factor', 'purchase_price', 'sale_price']);

  useEffect(() => {
    const [conversion, price] = watchedValues;
    if (conversion && price && conversion > 0) {
      setCalculatedUnitPrice(price / conversion);
    } else {
      setCalculatedUnitPrice(null);
    }
  }, [watchedValues]);

  const handleCreateVendor = async (vendorData: any) => {
    try {
      const newVendor = await vendorsApi.create(vendorData);
      await refreshVendors();
      form.setValue('vendor_id', newVendor.id);
      toast.success(`Vendor "${newVendor.name}" created and selected`);
    } catch (error) {
      console.error('Failed to create vendor:', error);
      toast.error('Failed to create vendor');
      throw error;
    }
  };

  useEffect(() => {
    if (itemId && open) {
      loadItem();
    } else if (open) {
      form.reset();
      setCalculatedUnitPrice(null);
      setCurrentItem(null);
    }
    
    if (!open) {
      setIsSubmitting(false);
    }
  }, [itemId, open]);

  const loadItem = async () => {
    try {
      const item = await getItemById(itemId!);
      if (item) {
        setCurrentItem(item);
        form.reset({
          name: item.name,
          description: item.description || '',
          category_id: item.category_id || '',
          base_unit_id: item.base_unit_id || '',
          purchase_unit: item.purchase_unit || '',
          conversion_factor: item.conversion_factor || undefined,
          purchase_price: item.purchase_price || undefined,
          sale_price: item.sale_price || undefined,
          sku: item.sku || '',
          barcode: item.barcode || '',
          location: item.location || '',
          team_id: item.team_id || null,
          vendor_id: item.vendor_id || null,
          image_url: item.image_url || null,
        });
      }
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Failed to load item details');
    }
  };

  const onSubmit = async (values: InventoryItemFormData) => {
    if (isSubmitting || loading) {
      return;
    }
    
    // Validate SKU uniqueness before submission
    if (values.sku && values.sku.trim() !== '') {
      try {
        const skuValidation = await validateSKUUniqueness(values.sku, itemId || undefined);
        if (!skuValidation.isUnique) {
          form.setError('sku', {
            type: 'manual',
            message: skuValidation.message || 'SKU must be unique'
          });
          toast.error(skuValidation.message || 'SKU is already in use');
          return;
        }
      } catch (skuError) {
        console.error('SKU validation error:', skuError);
        toast.error('Failed to validate SKU. Please try again.');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const itemData = {
        name: values.name || '',
        description: values.description,
        category_id: values.category_id || null,
        base_unit_id: values.base_unit_id || null,
        purchase_unit: values.purchase_unit || null,
        conversion_factor: values.conversion_factor || null,
        purchase_price: values.purchase_price || null,
        sku: values.sku,
        barcode: values.barcode,
        current_stock: 0,
        minimum_threshold: null,
        maximum_threshold: null,
        reorder_point: null,
        unit_cost: calculatedUnitPrice || null,
        sale_price: values.sale_price || null,
        location: values.location,
        is_active: true,
        is_template: false,
        sort_order: 0,
        team_id: values.team_id || null,
        vendor_id: values.vendor_id || null,
        image_url: values.image_url || null,
      };

      let result;
      if (itemId) {
        result = await updateItem(itemId, itemData);
      } else {
        result = await createItem(itemData);
      }
      
      if (itemId) {
        toast.success('Item updated successfully');
      } else {
        toast.success('Item created successfully');
      }
      
      onOpenChange(false);
      form.reset();
      setCalculatedUnitPrice(null);
    } catch (error) {
      console.error('Error saving item:', error);
      
      let errorMessage = 'Failed to save item';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your user role.';
        } else if (error.message.includes('required')) {
          errorMessage = 'Required fields are missing.';
        } else if (error.message.includes('unique')) {
          errorMessage = 'Duplicate value detected. Please check SKU and barcode.';
        } else {
          errorMessage = `Failed to save item: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLabelSystem = () => {
    toast.info('Use the Labels & Barcodes tab in Inventory Management for professional label generation');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {itemId ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="w-full mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={isSubmitting || loading} className="space-y-6">
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
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Enter SKU or generate one" {...field} />
                          </FormControl>
                          <SKUGeneratorButton
                            categoryId={form.watch('category_id')}
                            categories={categories}
                            currentSKU={field.value}
                            onSKUGenerated={(sku) => form.setValue('sku', sku)}
                            excludeId={itemId || undefined}
                            disabled={isSubmitting || loading}
                          />
                        </div>
                        <SKUValidationIndicator
                          sku={field.value}
                          excludeId={itemId || undefined}
                          className="mt-1"
                        />
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
                          <BarcodeInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Enter or scan barcode"
                          />
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

                {/* Item Type and Unit Type */}
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
                        <FormLabel>Unit Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.measurement_type} ({unit.abbreviation})
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

                {/* Team Assignment */}
                <FormField
                  control={form.control}
                  name="team_id"
                  render={({ field }) => (
                    <FormItem>
                      <TeamInventorySelector
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting || loading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vendor Selection */}
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <VendorSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        vendors={vendors}
                        onAddVendor={() => setIsVendorDialogOpen(true)}
                        disabled={isSubmitting || loading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Packaging Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Packaging Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="purchase_unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., case, bag, box" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="conversion_factor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units per Package</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 12"
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
                          <FormLabel>Package Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Unit Cost Display */}
                  {calculatedUnitPrice && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Calculated Unit Cost</div>
                      <div className="text-lg font-bold text-primary">
                        ${calculatedUnitPrice.toFixed(4)} per unit
                      </div>
                    </div>
                  )}
                </div>

                {/* Sale Price */}
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Storage location or area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting || loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openLabelSystem}
                    disabled={isSubmitting || loading}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate Labels
                  </Button>
                  <Button type="submit" disabled={isSubmitting || loading}>
                    {isSubmitting || loading ? 'Saving...' : itemId ? 'Update Item' : 'Create Item'}
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </div>

        <InventoryCategoryDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
        />

        <InventoryUnitDialog
          open={isUnitDialogOpen}
          onOpenChange={setIsUnitDialogOpen}
        />
        
        <VendorDialog
          open={isVendorDialogOpen}
          onOpenChange={setIsVendorDialogOpen}
          onSave={handleCreateVendor}
        />
      </DialogContent>
    </Dialog>
  );
};