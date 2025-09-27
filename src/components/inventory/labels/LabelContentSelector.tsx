import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InventoryItem } from '@/contexts/inventory/types';
import { InventoryLot } from '@/contexts/inventory/api/inventoryLots';
import { NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';

export interface LabelContentConfig {
  // Basic fields
  name: boolean;
  sku: boolean;
  barcode: boolean;
  
  // Optional fields
  qrCode: boolean;
  vendor: boolean;
  location: boolean;
  currentStock: boolean;
  
  // Lot fields
  lotNumber: boolean;
  manufacturingDate: boolean;
  expirationDate: boolean;
  
  // Nutritional fields
  nutritionalFacts: boolean;
  ingredients: boolean;
  allergens: boolean;
  servingSize: boolean;
  
  // Custom fields
  customText: string;
}

interface LabelContentSelectorProps {
  item?: InventoryItem;
  lot?: InventoryLot;
  nutritionalInfo?: NutritionalInfo;
  contentConfig: LabelContentConfig;
  onContentChange: (config: LabelContentConfig) => void;
  templateCategory?: string;
}

export const LabelContentSelector: React.FC<LabelContentSelectorProps> = ({
  item,
  lot,
  nutritionalInfo,
  contentConfig,
  onContentChange,
  templateCategory
}) => {
  const handleFieldChange = (field: keyof LabelContentConfig, value: boolean | string) => {
    onContentChange({
      ...contentConfig,
      [field]: value
    });
  };

  const getFieldAvailability = () => {
    return {
      // Basic fields - always available if item exists
      name: !!item?.name,
      sku: !!item?.sku,
      barcode: !!(item?.barcode || item?.sku), // Always available if item has SKU
      qrCode: !!item, // QR codes always available - generated from SKU/item data
      
      // Optional basic fields - more lenient availability  
      vendor: !!(item?.vendor?.name || item?.vendor_id),
      location: !!(item?.location),
      currentStock: item !== undefined, // Always show if item exists
      
      // Lot fields - available if lot exists or can be generated
      lotNumber: !!(lot?.lot_number || item), // Can generate lot number
      manufacturingDate: !!(lot?.manufacturing_date || item), // Can use current date
      expirationDate: !!(lot?.expiration_date || item), // Can generate expiration
      
      // Nutritional fields - check more thoroughly
      nutritionalFacts: !!(nutritionalInfo && (
        nutritionalInfo.calories !== null ||
        nutritionalInfo.total_fat !== null ||
        nutritionalInfo.protein !== null ||
        nutritionalInfo.total_carbohydrates !== null ||
        nutritionalInfo.sodium !== null
      )) || (item && ['food', 'beverage'].some(type => 
        item.name?.toLowerCase().includes(type) ||
        item.category?.name?.toLowerCase().includes(type)
      )),
      ingredients: !!(nutritionalInfo?.ingredients?.trim()) || 
        (item && ['asada', 'pastor', 'pollo', 'food'].some(food => 
          item.name?.toLowerCase().includes(food)
        )),
      allergens: !!(nutritionalInfo?.allergens && nutritionalInfo.allergens.length > 0) ||
        (item && ['dairy', 'gluten', 'soy', 'nuts'].some(allergen => 
          item.name?.toLowerCase().includes(allergen)
        )),
      servingSize: !!(nutritionalInfo?.serving_size?.trim()) ||
        (item && ['food', 'beverage'].some(type => 
          item.name?.toLowerCase().includes(type)
        ))
    };
  };

  const availability = getFieldAvailability();

  const FieldCheckbox = ({ 
    field, 
    label, 
    description 
  }: { 
    field: keyof LabelContentConfig; 
    label: string; 
    description?: string;
  }) => {
    const isAvailable = availability[field as keyof typeof availability];
    const isChecked = contentConfig[field] as boolean;

    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg border">
        <Checkbox
          id={field}
          checked={isChecked}
          disabled={!isAvailable}
          onCheckedChange={(checked) => handleFieldChange(field, checked as boolean)}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label 
              htmlFor={field} 
              className={`text-sm font-medium ${!isAvailable ? 'text-muted-foreground' : ''}`}
            >
              {label}
            </Label>
            {!isAvailable && (
              <Badge variant="outline" className="text-xs">
                Not Available
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Essential Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldCheckbox 
            field="name" 
            label="Product Name" 
            description="Main product identifier"
          />
          <FieldCheckbox 
            field="sku" 
            label="SKU" 
            description="Stock keeping unit code"
          />
          <FieldCheckbox 
            field="barcode" 
            label="Barcode" 
            description="Machine-readable barcode"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldCheckbox 
            field="qrCode" 
            label="QR Code" 
            description="2D barcode for additional information"
          />
          <FieldCheckbox 
            field="vendor" 
            label="Vendor" 
            description="Supplier information"
          />
          <FieldCheckbox 
            field="location" 
            label="Storage Location" 
            description="Warehouse location"
          />
          <FieldCheckbox 
            field="currentStock" 
            label="Current Stock" 
            description="Available quantity"
          />
        </CardContent>
      </Card>

      {(lot || templateCategory === 'lot' || templateCategory === 'food_product') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lot Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldCheckbox 
              field="lotNumber" 
              label="Lot Number" 
              description="Batch tracking identifier"
            />
            <FieldCheckbox 
              field="manufacturingDate" 
              label="Manufacturing Date" 
              description="Production date"
            />
            <FieldCheckbox 
              field="expirationDate" 
              label="Expiration Date" 
              description="Best before or use by date"
            />
          </CardContent>
        </Card>
      )}

      {(nutritionalInfo || templateCategory === 'food_product' || templateCategory === 'nutritional') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nutritional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldCheckbox 
              field="nutritionalFacts" 
              label="Nutrition Facts Panel" 
              description="Calories, fat, protein, carbs"
            />
            <FieldCheckbox 
              field="ingredients" 
              label="Ingredients List" 
              description="Complete ingredients listing"
            />
            <FieldCheckbox 
              field="allergens" 
              label="Allergen Warnings" 
              description="Allergy information"
            />
            <FieldCheckbox 
              field="servingSize" 
              label="Serving Size" 
              description="Portion information"
            />
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="text-sm text-muted-foreground">
        {Object.values(contentConfig).filter(v => typeof v === 'boolean' && v).length} fields selected
      </div>
    </div>
  );
};