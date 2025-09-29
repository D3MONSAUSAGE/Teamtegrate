import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { InventoryItem } from '@/contexts/inventory/types';

interface LabelPreviewProps {
  selectedItem: InventoryItem | null;
  companyName: string;
  companyAddress: string;
  netWeight: string;
  logoPreview: string;
  lotCode: string;
  servingSize: string;
  calories: string;
  ingredients: string;
  allergens: string;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
  selectedItem,
  companyName,
  companyAddress,
  netWeight,
  logoPreview,
  lotCode,
  servingSize,
  calories,
  ingredients,
  allergens
}) => {
  if (!selectedItem) return null;

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-primary" />
          Label Preview (4×6 Thermal)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 4x6 aspect ratio preview */}
        <div className="bg-white border-2 border-dashed border-muted-foreground/30 p-4 rounded-lg mx-auto" 
             style={{ aspectRatio: '4/6', width: '280px', fontSize: '10px' }}>
          
          {/* Header Section */}
          <div className="text-center mb-3">
            {logoPreview && (
              <div className="mb-2">
                <img 
                  src={logoPreview} 
                  alt="Company logo" 
                  className="h-12 w-12 mx-auto object-contain rounded"
                />
              </div>
            )}
            <div className="font-bold text-xs uppercase tracking-wide">
              {companyName}
            </div>
            {companyAddress && (
              <div className="text-[8px] text-muted-foreground mt-1">
                {companyAddress}
              </div>
            )}
          </div>

          {/* Divider */}
          <hr className="border-t border-gray-300 mb-2" />

          {/* Product Name */}
          <div className="text-center mb-2">
            <div className="font-bold text-sm">{selectedItem.name}</div>
            {netWeight && (
              <div className="text-xs mt-1">Net Weight: {netWeight}</div>
            )}
          </div>

          {/* SKU and Date */}
          <div className="flex justify-between items-center mb-2 text-[8px]">
            <span>SKU: {selectedItem.sku || 'N/A'}</span>
            <span>DATE: {new Date().toLocaleDateString()}</span>
          </div>

          {/* Lot Code */}
          {lotCode && (
            <div className="text-[8px] font-bold mb-2">LOT: {lotCode}</div>
          )}

          {/* Barcode Placeholder */}
          <div className="bg-black h-6 mb-2 flex items-center justify-center text-white text-[6px]">
            BARCODE: {selectedItem.barcode || selectedItem.sku || lotCode}
          </div>

          {/* Nutrition Facts Preview */}
          {(servingSize || calories) && (
            <div className="border border-black p-1 mb-2">
              <div className="font-bold text-[8px] mb-1">Nutrition Facts</div>
              {servingSize && (
                <div className="text-[7px] mb-1">Serving: {servingSize}</div>
              )}
              {calories && (
                <div className="text-[8px] font-bold">Calories {calories}</div>
              )}
              <div className="text-[6px] text-muted-foreground">
                [Two-column nutrition layout...]
              </div>
            </div>
          )}

          {/* Ingredients */}
          {ingredients && (
            <div className="mb-1">
              <div className="text-[7px] font-bold">INGREDIENTS:</div>
              <div className="text-[6px] leading-tight">
                {ingredients.length > 80 ? `${ingredients.substring(0, 80)}...` : ingredients}
              </div>
            </div>
          )}

          {/* Allergens */}
          {allergens && (
            <div className="mb-1">
              <div className="text-[6px] font-bold">CONTAINS:</div>
              <div className="text-[6px]">{allergens}</div>
            </div>
          )}

          {/* Footer indicator */}
          <div className="text-center mt-2">
            <Badge variant="secondary" className="text-[6px] px-1 py-0">
              Thermal Print Optimized
            </Badge>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Preview shows approximate layout for 4×6 thermal label
        </p>
      </CardContent>
    </Card>
  );
};