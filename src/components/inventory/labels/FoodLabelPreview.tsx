import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';

interface FoodLabelPreviewProps {
  itemData?: {
    name?: string;
    sku?: string;
    lot_number?: string;
    expiration_date?: string;
    ingredients?: string;
    allergens?: string;
    nutritional_info?: any;
  };
}

export const FoodLabelPreview: React.FC<FoodLabelPreviewProps> = ({ itemData }) => {
  const sampleData = {
    name: itemData?.name || 'Premium Organic Granola',
    sku: itemData?.sku || 'SKU123456789',
    lot_number: itemData?.lot_number || 'LOT2412151234',
    expiration_date: itemData?.expiration_date || '2025-12-15',
    ingredients: itemData?.ingredients || 'Organic oats, almonds, honey, dried cranberries, sunflower oil, vanilla extract, sea salt',
    allergens: itemData?.allergens || 'Tree nuts (almonds), Manufactured in facility that processes peanuts',
    image_url: (itemData as any)?.image_url || '',
    nutritional_info: itemData?.nutritional_info || {
      servingSize: '1/2 cup (40g)',
      calories: 180,
      totalFat: 7,
      sodium: 65,
      totalCarbs: 28,
      protein: 4
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-white border-2 border-gray-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg font-bold">
          {sampleData.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Product Image and SKU Row */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm font-medium">SKU: {sampleData.sku}</div>
          </div>
          {sampleData.image_url && (
            <div className="w-12 h-12 border border-border rounded overflow-hidden bg-muted">
              <img 
                src={sampleData.image_url} 
                alt={sampleData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Barcode */}
        <div className="space-y-1">
          <div className="flex justify-center">
            <div className="bg-black text-white px-2 py-1 font-mono text-xs">
              ||||| |||| ||||| BARCODE |||||
            </div>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="flex justify-end">
          <div className="w-8 h-8 bg-black flex items-center justify-center text-white text-xs">
            QR
          </div>
        </div>

        {/* Lot and Expiration */}
        <div className="border-t pt-2">
          <div className="font-semibold">LOT: {sampleData.lot_number}</div>
          <div className="font-semibold">EXP: {new Date(sampleData.expiration_date).toLocaleDateString()}</div>
        </div>

        {/* Nutritional Facts */}
        <div className="border-t pt-2">
          <div className="font-bold text-sm">Nutrition Facts</div>
          <div className="text-xs space-y-0.5">
            <div>Serving Size: {sampleData.nutritional_info.servingSize}</div>
            <div className="font-semibold">Calories: {sampleData.nutritional_info.calories}</div>
            <div>Total Fat: {sampleData.nutritional_info.totalFat}g</div>
            <div>Sodium: {sampleData.nutritional_info.sodium}mg</div>
            <div>Total Carbs: {sampleData.nutritional_info.totalCarbs}g</div>
            <div>Protein: {sampleData.nutritional_info.protein}g</div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="border-t pt-2">
          <div className="font-bold">INGREDIENTS:</div>
          <div className="text-xs leading-tight">{sampleData.ingredients}</div>
        </div>

        {/* Allergen Warning */}
        <div className="border-t pt-2">
          <div className="font-bold">ALLERGEN WARNING:</div>
          <div className="text-xs font-medium bg-yellow-100 p-1 rounded">
            Contains: {sampleData.allergens}
          </div>
        </div>

        {/* Footer badges */}
        <div className="flex justify-between pt-2">
          <Badge variant="outline" className="text-xs">
            Thermal Optimized
          </Badge>
          <Badge variant="outline" className="text-xs">
            4" × 6"
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};