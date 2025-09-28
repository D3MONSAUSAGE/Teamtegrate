import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { Textarea } from '@/components/ui/textarea';
import { Package, Calculator, Plus, Scan, QrCode, Apple } from 'lucide-react';
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
import { IngredientsPanel } from './IngredientsPanel';
import { NutritionalInfoForm } from './NutritionalInfoForm';
import { LabelPrintDialog } from './labels/LabelPrintDialog';
import { vendorsApi } from '@/contexts/inventory/api';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';

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
    // This validation will be handled by the SKUValidationIndicator component
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
  
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // Shared state for ingredients and nutritional info
  const [ingredientsData, setIngredientsData] = useState({
    ingredients: '',
    allergens: [] as string[]
  });
  
  const [nutritionalData, setNutritionalData] = useState({
    serving_size: '',
    servings_per_container: 0,
    calories: 0,
    total_fat: 0,
    saturated_fat: 0,
    trans_fat: 0,
    cholesterol: 0,
    sodium: 0,
    total_carbohydrates: 0,
    dietary_fiber: 0,
    total_sugars: 0,
    added_sugars: 0,
    protein: 0,
    vitamin_d: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    additional_nutrients: {}
  });

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
      // Reset shared state for new items
      setIngredientsData({ ingredients: '', allergens: [] });
      setNutritionalData({
        serving_size: '',
        servings_per_container: 0,
        calories: 0,
        total_fat: 0,
        saturated_fat: 0,
        trans_fat: 0,
        cholesterol: 0,
        sodium: 0,
        total_carbohydrates: 0,
        dietary_fiber: 0,
        total_sugars: 0,
        added_sugars: 0,
        protein: 0,
        vitamin_d: 0,
        calcium: 0,
        iron: 0,
        potassium: 0,
        additional_nutrients: {}
      });
    }
    
    // Reset submitting state when dialog opens/closes
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
        
        // Load nutritional info for shared state
        try {
          const nutritionalInfo = await nutritionalInfoApi.getByItemId(itemId!);
          if (nutritionalInfo) {
            setIngredientsData({
              ingredients: nutritionalInfo.ingredients || '',
              allergens: nutritionalInfo.allergens || []
            });
            setNutritionalData({
              serving_size: nutritionalInfo.serving_size || '',
              servings_per_container: nutritionalInfo.servings_per_container || 0,
              calories: nutritionalInfo.calories || 0,
              total_fat: nutritionalInfo.total_fat || 0,
              saturated_fat: nutritionalInfo.saturated_fat || 0,
              trans_fat: nutritionalInfo.trans_fat || 0,
              cholesterol: nutritionalInfo.cholesterol || 0,
              sodium: nutritionalInfo.sodium || 0,
              total_carbohydrates: nutritionalInfo.total_carbohydrates || 0,
              dietary_fiber: nutritionalInfo.dietary_fiber || 0,
              total_sugars: nutritionalInfo.total_sugars || 0,
              added_sugars: nutritionalInfo.added_sugars || 0,
              protein: nutritionalInfo.protein || 0,
              vitamin_d: nutritionalInfo.vitamin_d || 0,
              calcium: nutritionalInfo.calcium || 0,
              iron: nutritionalInfo.iron || 0,
              potassium: nutritionalInfo.potassium || 0,
              additional_nutrients: nutritionalInfo.additional_nutrients || {}
            });
          }
        } catch (nutritionalError) {
          console.log('No nutritional info found for item, using defaults');
        }
      }
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Failed to load item details');
    }
  };

  const onSubmit = async (values: InventoryItemFormData) => {
    // Prevent multiple submissions
    if (isSubmitting || loading) {
      console.log('🛑 Submission blocked - already submitting or loading');
      return;
    }
    
    console.log('📋 Starting item submission...', values);
    
    // Validate SKU uniqueness before submission
    if (values.sku && values.sku.trim() !== '') {
      console.log('🔍 Validating SKU uniqueness:', values.sku);
      try {
        const skuValidation = await validateSKUUniqueness(values.sku, itemId || undefined);
        if (!skuValidation.isUnique) {
          console.log('❌ SKU validation failed:', skuValidation.message);
          form.setError('sku', {
            type: 'manual',
            message: skuValidation.message || 'SKU must be unique'
          });
          toast.error(skuValidation.message || 'SKU is already in use');
          return;
        }
        console.log('✅ SKU validation passed');
      } catch (skuError) {
        console.error('❌ SKU validation error:', skuError);
        toast.error('Failed to validate SKU. Please try again.');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('📊 Form values submitted:', values);
      console.log('💰 Calculated unit price:', calculatedUnitPrice);
      
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

      console.log('📦 Item data being sent:', itemData);

      let result;
      if (itemId) {
        console.log('✏️ Updating existing item:', itemId);
        result = await updateItem(itemId, itemData);
        console.log('✅ Update result:', result);
      } else {
        console.log('➕ Creating new item...');
        result = await createItem(itemData);
        console.log('✅ Create result:', result);
      }
      
      // Save ingredients and nutritional info using the result item ID
      const savedItemId = itemId || result?.id;
      if (savedItemId && (ingredientsData.ingredients || ingredientsData.allergens.length > 0 || 
          Object.values(nutritionalData).some(val => val !== '' && val !== 0))) {
        try {
          console.log('💊 Saving nutritional info for item:', savedItemId);
          await nutritionalInfoApi.upsert({
            item_id: savedItemId,
            ingredients: ingredientsData.ingredients || null,
            allergens: ingredientsData.allergens.length > 0 ? ingredientsData.allergens : null,
            serving_size: nutritionalData.serving_size || null,
            servings_per_container: nutritionalData.servings_per_container > 0 ? nutritionalData.servings_per_container : null,
            calories: nutritionalData.calories > 0 ? nutritionalData.calories : null,
            total_fat: nutritionalData.total_fat > 0 ? nutritionalData.total_fat : null,
            saturated_fat: nutritionalData.saturated_fat > 0 ? nutritionalData.saturated_fat : null,
            trans_fat: nutritionalData.trans_fat > 0 ? nutritionalData.trans_fat : null,
            cholesterol: nutritionalData.cholesterol > 0 ? nutritionalData.cholesterol : null,
            sodium: nutritionalData.sodium > 0 ? nutritionalData.sodium : null,
            total_carbohydrates: nutritionalData.total_carbohydrates > 0 ? nutritionalData.total_carbohydrates : null,
            dietary_fiber: nutritionalData.dietary_fiber > 0 ? nutritionalData.dietary_fiber : null,
            total_sugars: nutritionalData.total_sugars > 0 ? nutritionalData.total_sugars : null,
            added_sugars: nutritionalData.added_sugars > 0 ? nutritionalData.added_sugars : null,
            protein: nutritionalData.protein > 0 ? nutritionalData.protein : null,
            vitamin_d: nutritionalData.vitamin_d > 0 ? nutritionalData.vitamin_d : null,
            calcium: nutritionalData.calcium > 0 ? nutritionalData.calcium : null,
            iron: nutritionalData.iron > 0 ? nutritionalData.iron : null,
            potassium: nutritionalData.potassium > 0 ? nutritionalData.potassium : null,
            additional_nutrients: Object.keys(nutritionalData.additional_nutrients).length > 0 ? nutritionalData.additional_nutrients : null
          });
          console.log('✅ Nutritional info saved successfully');
        } catch (nutritionalError) {
          console.error('❌ Error saving nutritional info:', nutritionalError);
          toast.error('Item saved but failed to save nutritional information');
        }
      }
      
      // Success message after everything is saved
      if (itemId) {
        toast.success('Item and nutritional info updated successfully');
      } else {
        toast.success('Item and nutritional info created successfully');
      }
      
      // Only close dialog and reset form on success
      console.log('🎉 Operation successful, closing dialog');
      onOpenChange(false);
      form.reset();
      setCalculatedUnitPrice(null);
    } catch (error) {
      console.error('❌ Error saving item:', error);
      console.error('📝 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {itemId ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
            {currentItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabelDialog(true)}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Generate Label
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="nutrition">Nutritional Info</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
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
                        label="Team Access"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl>
                        <VendorSelector
                          vendors={vendors}
                          value={field.value || undefined}
                          onValueChange={(value) => field.onChange(value || null)}
                          onAddVendor={() => setIsVendorDialogOpen(true)}
                          disabled={isSubmitting || loading}
                        />
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
                      <ImageUpload
                        value={field.value || undefined}
                        onChange={(imageUrl) => field.onChange(imageUrl)}
                        disabled={isSubmitting || loading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Package Information */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="flex items-center gap-2 font-medium text-sm">
                    <Package className="h-4 w-4" />
                    How do you buy this item?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="conversion_factor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units per Package</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.0001"
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

                   <FormField
                     control={form.control}
                     name="sale_price"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Sale Price (per unit)</FormLabel>
                         <FormControl>
                           <Input 
                             type="number" 
                             step="0.01"
                             placeholder="e.g., 2.50" 
                             {...field} 
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   {calculatedUnitPrice !== null && (
                     <div className="bg-primary/5 border border-primary/20 p-4 rounded-md space-y-3">
                       <div className="flex items-center gap-2 mb-2">
                         <Calculator className="h-4 w-4 text-primary" />
                         <span className="font-medium text-primary">Pricing Analysis</span>
                       </div>
                       <div>
                         <p className="text-lg font-semibold">
                           ${calculatedUnitPrice.toFixed(4)} per {form.watch('base_unit_id') ? units.find(u => u.id === form.watch('base_unit_id'))?.measurement_type || 'unit' : 'unit'}
                         </p>
                         <p className="text-sm text-muted-foreground mt-1">
                           This is what each individual {form.watch('base_unit_id') ? units.find(u => u.id === form.watch('base_unit_id'))?.measurement_type || 'unit' : 'unit'} costs based on your package pricing
                         </p>
                       </div>
                       {form.watch('sale_price') && (
                         <div className="pt-2 border-t border-primary/10">
                           <div className="flex justify-between items-center">
                             <span className="text-sm font-medium">Profit per unit:</span>
                             <span className="font-semibold text-green-600">
                               ${(form.watch('sale_price') - calculatedUnitPrice).toFixed(4)}
                             </span>
                           </div>
                           <div className="flex justify-between items-center mt-1">
                             <span className="text-sm font-medium">Profit margin:</span>
                             <span className="font-semibold text-green-600">
                               {(((form.watch('sale_price') - calculatedUnitPrice) / form.watch('sale_price')) * 100).toFixed(1)}%
                             </span>
                           </div>
                           {(form.watch('sale_price') - calculatedUnitPrice) < 0 && (
                             <p className="text-sm text-red-600 mt-2">
                               ⚠️ Warning: You're selling at a loss
                             </p>
                           )}
                         </div>
                       )}
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
                </fieldset>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting || loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || loading}>
                    {isSubmitting || loading ? 'Saving...' : itemId ? 'Update Item' : 'Create Item'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="ingredients" className="mt-6">
            <IngredientsPanel
              itemId={itemId || 'new-item'}
              itemName={form.watch('name') || 'New Item'}
              data={ingredientsData}
              onChange={setIngredientsData}
            />
          </TabsContent>

          <TabsContent value="nutrition" className="mt-6">
            <NutritionalInfoForm
              itemId={itemId || 'new-item'}
              itemName={form.watch('name') || 'New Item'}
              data={nutritionalData}
              onChange={setNutritionalData}
            />
          </TabsContent>
        </Tabs>

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

        {currentItem && (
          <LabelPrintDialog
            open={showLabelDialog}
            onOpenChange={setShowLabelDialog}
            item={currentItem}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};