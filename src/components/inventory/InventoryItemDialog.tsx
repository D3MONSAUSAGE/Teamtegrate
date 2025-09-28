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
import { vendorsApi } from '@/contexts/inventory/api';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { 
  buildNutritionPayload, 
  hasNutritionOrIngredients, 
  sanitizeFilename, 
  nutritionalSchema, 
  ingredientsSchema 
} from '@/utils/nutritionalValidation';
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
  const { user } = useAuth();
  
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  
  // Shared state for ingredients and nutritional info
  const [ingredientsData, setIngredientsData] = useState({
    ingredients: '',
    allergens: [] as string[]
  });
  
  const [nutritionalData, setNutritionalData] = useState({
    serving_size: '',
    nutritional_fields: []
  });

  // Convert flat nutritional data to additive structure
  const convertFlatToAdditive = (flatData: any) => {
    const fieldMappings = [
      { name: 'Servings per Container', key: 'servings_per_container', unit: 'servings' },
      { name: 'Calories', key: 'calories', unit: 'kcal' },
      { name: 'Total Fat', key: 'total_fat', unit: 'g' },
      { name: 'Saturated Fat', key: 'saturated_fat', unit: 'g' },
      { name: 'Trans Fat', key: 'trans_fat', unit: 'g' },
      { name: 'Cholesterol', key: 'cholesterol', unit: 'mg' },
      { name: 'Sodium', key: 'sodium', unit: 'mg' },
      { name: 'Total Carbohydrates', key: 'total_carbohydrates', unit: 'g' },
      { name: 'Dietary Fiber', key: 'dietary_fiber', unit: 'g' },
      { name: 'Total Sugars', key: 'total_sugars', unit: 'g' },
      { name: 'Added Sugars', key: 'added_sugars', unit: 'g' },
      { name: 'Protein', key: 'protein', unit: 'g' },
      { name: 'Vitamin D', key: 'vitamin_d', unit: 'mcg' },
      { name: 'Calcium', key: 'calcium', unit: 'mg' },
      { name: 'Iron', key: 'iron', unit: 'mg' },
      { name: 'Potassium', key: 'potassium', unit: 'mg' },
    ];

    const nutritional_fields = fieldMappings
      .filter(field => flatData[field.key] !== null && flatData[field.key] !== undefined && flatData[field.key] !== '' && flatData[field.key] !== 0)
      .map(field => ({
        name: field.name,
        value: String(flatData[field.key]),
        unit: field.unit
      }));

    return {
      serving_size: flatData.serving_size || '',
      nutritional_fields
    };
  };

  // Convert additive structure to flat structure for database
  const convertAdditiveToFlat = (additiveData: any) => {
    const flatData: any = {
      serving_size: additiveData.serving_size || null,
      servings_per_container: null,
      calories: null,
      total_fat: null,
      saturated_fat: null,
      trans_fat: null,
      cholesterol: null,
      sodium: null,
      total_carbohydrates: null,
      dietary_fiber: null,
      total_sugars: null,
      added_sugars: null,
      protein: null,
      vitamin_d: null,
      calcium: null,
      iron: null,
      potassium: null,
      additional_nutrients: null
    };

    const fieldMappings = {
      'Servings per Container': 'servings_per_container',
      'Calories': 'calories',
      'Total Fat': 'total_fat',
      'Saturated Fat': 'saturated_fat',
      'Trans Fat': 'trans_fat',
      'Cholesterol': 'cholesterol',
      'Sodium': 'sodium',
      'Total Carbohydrates': 'total_carbohydrates',
      'Dietary Fiber': 'dietary_fiber',
      'Total Sugars': 'total_sugars',
      'Added Sugars': 'added_sugars',
      'Protein': 'protein',
      'Vitamin D': 'vitamin_d',
      'Calcium': 'calcium',
      'Iron': 'iron',
      'Potassium': 'potassium'
    };

    additiveData.nutritional_fields?.forEach((field: any) => {
      const dbKey = fieldMappings[field.name as keyof typeof fieldMappings];
      if (dbKey && field.value && field.value !== '') {
        const numValue = parseFloat(field.value);
        if (!isNaN(numValue)) {
          flatData[dbKey] = numValue;
        }
      }
    });

    return flatData;
  };

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
        nutritional_fields: []
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
            setNutritionalData(convertFlatToAdditive(nutritionalInfo));
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
      if (savedItemId) {
        console.log('💾 Checking nutritional data to save:', {
          ingredientsData,
          nutritionalData,
          hasIngredients: !!ingredientsData.ingredients,
          hasAllergens: ingredientsData.allergens.length > 0,
          hasNutritionalValues: nutritionalData.serving_size !== '' || nutritionalData.nutritional_fields.length > 0
        });
        
        // Validate nutritional data
        try {
          nutritionalSchema.parse(nutritionalData);
          ingredientsSchema.parse(ingredientsData);
        } catch (validationError: any) {
          console.error('[NUTRI_SAVE] Validation error:', validationError);
          toast.error('Invalid nutritional data: ' + validationError.errors?.[0]?.message || 'Please check your inputs');
          return;
        }

        // Check if we have any nutritional data to save (convert to flat structure first for consistency)
        const flatNutritionalForCheck = convertAdditiveToFlat(nutritionalData);
        const hasDataToSave = hasNutritionOrIngredients(flatNutritionalForCheck, ingredientsData);
          
        console.log('💾 Has data to save:', hasDataToSave);
        
        if (hasDataToSave) {
          try {
            console.log('💊 Saving nutritional info for item:', savedItemId);
            const flatNutritionalData = convertAdditiveToFlat(nutritionalData);
            const nutritionalPayload = buildNutritionPayload(
              { ...flatNutritionalData, ingredients: ingredientsData.ingredients, allergens: ingredientsData.allergens }, 
              savedItemId,
              user
            );
            
            console.log('💊 Nutritional payload:', nutritionalPayload);
            const nutritionalResult = await nutritionalInfoApi.upsert(nutritionalPayload);
            console.log('✅ Nutritional info saved successfully:', nutritionalResult);
          } catch (nutritionalError: any) {
            console.error('❌ Error saving nutritional info:', nutritionalError);
            
            let errorMessage = 'Failed to save nutritional information';
            if (nutritionalError?.message?.includes('permission')) {
              errorMessage = 'Permission denied when saving nutrition data. Please check your access rights.';
            } else if (nutritionalError?.message?.includes('organization_id')) {
              errorMessage = 'Organization context missing. Please refresh and try again.';
            } else if (nutritionalError?.message) {
              errorMessage = `Nutrition save failed: ${nutritionalError.message}`;
            }
            
            toast.error(errorMessage);
            throw nutritionalError; // Don't continue if nutrition fails
          }
        } else {
          console.log('⏭️ No nutritional data to save, skipping...');
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

  const generateSimpleLabel = async () => {
    if (isGeneratingLabel || isSubmitting) {
      console.log('[LABEL_GEN] Blocked - operation in progress');
      return;
    }

    setIsGeneratingLabel(true);
    
    try {
      console.log('[LABEL_GEN] Start', { 
        itemId: itemId || 'new', 
        name: form.watch('name'),
        hasNutrition: hasNutritionOrIngredients(nutritionalData, ingredientsData)
      });

      const itemName = form.watch('name') || 'Untitled Item';
      const itemSKU = form.watch('sku') || 'N/A';
      const itemBarcode = form.watch('barcode') || form.watch('sku') || itemId || 'NO-CODE';

      const labelContent = [
        { type: 'text' as const, value: itemName, x: 20, y: 30, options: { fontSize: 16, fontWeight: 'bold' } },
        { type: 'text' as const, value: `SKU: ${itemSKU}`, x: 20, y: 50, options: { fontSize: 10 } },
        { type: 'barcode' as const, value: itemBarcode, x: 20, y: 70, options: { 
          format: 'CODE128', 
          width: 100, 
          height: 30,
          symbology: 'code128',
          quiet: 10 
        } },
      ];

      // Add nutritional facts if available
      const flatNutritionalForLabel = convertAdditiveToFlat(nutritionalData);
      if (hasNutritionOrIngredients(flatNutritionalForLabel, ingredientsData)) {
        if (nutritionalData.serving_size || nutritionalData.nutritional_fields.length > 0) {
          const nutritionData = {
            servingSize: nutritionalData.serving_size,
            calories: flatNutritionalForLabel.calories,
            totalFat: flatNutritionalForLabel.total_fat,
            sodium: flatNutritionalForLabel.sodium,
            totalCarbs: flatNutritionalForLabel.total_carbohydrates,
            protein: flatNutritionalForLabel.protein
          };
          
          labelContent.push({
            type: 'nutritional_facts' as any,
            value: JSON.stringify(nutritionData),
            x: 20,
            y: 120,
            options: { fontSize: 8 } as any
          });
        }

        // Add ingredients if available
        const ingredients = ingredientsData.ingredients?.trim();
        if (ingredients) {
          labelContent.push({
            type: 'ingredients_list' as any,
            value: ingredients,
            x: 20,
            y: 200,
            options: { fontSize: 7 } as any
          });
        }

        // Add allergen warning if available
        const allergens = ingredientsData.allergens?.length ? ingredientsData.allergens.join(', ') : '';
        if (allergens) {
          labelContent.push({
            type: 'allergen_warning' as any,
            value: allergens,
            x: 20,
            y: 260,
            options: { fontSize: 7 } as any
          });
        }
      }

      // Generate PDF using existing BarcodeGenerator
      const pdf = BarcodeGenerator.createLabelPDF(labelContent, { width: 4, height: 6 });
      const filename = sanitizeFilename(itemName);
      pdf.save(`label-${filename}.pdf`);
      
      console.log('[LABEL_GEN] Done - PDF generated successfully');
      toast.success('Label generated successfully!');
      
    } catch (error: any) {
      console.error('[LABEL_GEN] Error:', error);
      toast.error('Failed to generate label: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsGeneratingLabel(false);
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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={generateSimpleLabel}
                    disabled={
                      isGeneratingLabel || 
                      isSubmitting || 
                      loading || 
                      (!hasNutritionOrIngredients(convertAdditiveToFlat(nutritionalData), ingredientsData) && !form.watch('name'))
                    }
                    title={
                      !hasNutritionOrIngredients(convertAdditiveToFlat(nutritionalData), ingredientsData) && !form.watch('name')
                        ? "Add nutritional info, ingredients, or a product name to generate a label" 
                        : "Generate a PDF label with current data"
                    }
                  >
                    {isGeneratingLabel ? 'Generating...' : 'Print Label'}
                  </Button>
                  <Button type="submit" disabled={isSubmitting || loading || isGeneratingLabel}>
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
      </DialogContent>
    </Dialog>
  );
};