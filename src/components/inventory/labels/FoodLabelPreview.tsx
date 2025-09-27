import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { InventoryItem } from '@/contexts/inventory/types';
import { NutritionalInfo, nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { InventoryLot, inventoryLotsApi } from '@/contexts/inventory/api/inventoryLots';
import { ProductImage } from '@/components/inventory/ProductImage';

interface FoodLabelPreviewProps {
  selectedItems?: InventoryItem[];
  selectedItemId?: string;
  onItemChange?: (itemId: string) => void;
}

export const FoodLabelPreview: React.FC<FoodLabelPreviewProps> = ({
  selectedItems = [], 
  selectedItemId,
  onItemChange 
}) => {
  const [currentItemId, setCurrentItemId] = useState<string>(selectedItemId || '');
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const currentItem = selectedItems.find(item => item.id === currentItemId) || selectedItems[0];

  useEffect(() => {
    if (selectedItemId && selectedItemId !== currentItemId) {
      setCurrentItemId(selectedItemId);
    }
  }, [selectedItemId, currentItemId]);

  useEffect(() => {
    if (currentItem) {
      loadItemData();
      generateCodes();
    }
  }, [currentItem]);

  const loadItemData = async () => {
    if (!currentItem) return;
    
    setLoading(true);
    try {
      // Load nutritional info
      const nutritional = await nutritionalInfoApi.getByItemId(currentItem.id);
      setNutritionalInfo(nutritional);

      // Load lots
      const itemLots = await inventoryLotsApi.getByItemId(currentItem.id);
      setLots(itemLots.filter(lot => lot.quantity_remaining > 0));
    } catch (error) {
      console.error('Error loading item data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    if (!currentItem) return;

    try {
      // Generate barcode
      const barcodeValue = currentItem.barcode || currentItem.sku || currentItem.id;
      const barcode = BarcodeGenerator.generateBarcode(barcodeValue, {
        format: 'CODE128',
        width: 2,
        height: 25,
        fontSize: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
      setBarcodeImage(barcode);

      // Generate QR code with item data
      const qrData = JSON.stringify({
        id: currentItem.id,
        name: currentItem.name,
        sku: currentItem.sku,
        barcode: currentItem.barcode
      });
      const qrCode = await BarcodeGenerator.generateQRCode(qrData, {
        width: 80,
        margin: 1
      });
      setQrCodeImage(qrCode);
    } catch (error) {
      console.error('Error generating codes:', error);
    }
  };

  const handleItemChange = (itemId: string) => {
    setCurrentItemId(itemId);
    onItemChange?.(itemId);
  };

  if (!currentItem) {
    return (
      <Card className="w-full max-w-sm mx-auto bg-card border-2 border-border">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No item selected</p>
        </CardContent>
      </Card>
    );
  }

  const activeLot = lots[0];
  const today = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);

  const labelData = {
    name: currentItem.name,
    sku: currentItem.sku || `SKU-${currentItem.id.slice(-6)}`,
    lot_number: activeLot?.lot_number || `LOT${today.toISOString().slice(2, 10).replace(/-/g, '')}${Math.random().toString(36).slice(-4).toUpperCase()}`,
    expiration_date: activeLot?.expiration_date || futureDate.toISOString().split('T')[0],
    ingredients: nutritionalInfo?.ingredients || 'Organic ingredients, natural flavors, preservatives',
    allergens: nutritionalInfo?.allergens?.join(', ') || 'May contain traces of nuts and dairy',
    image_url: currentItem.image_url,
    nutritional_info: {
      servingSize: nutritionalInfo?.serving_size || '1 serving (100g)',
      calories: nutritionalInfo?.calories || 250,
      totalFat: nutritionalInfo?.total_fat || 12,
      sodium: nutritionalInfo?.sodium || 350,
      totalCarbs: nutritionalInfo?.total_carbohydrates || 28,
      protein: nutritionalInfo?.protein || 15
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-card border-2 border-border">
      <CardHeader className="pb-2">
        {selectedItems.length > 1 && (
          <div className="mb-2">
            <Select value={currentItemId} onValueChange={handleItemChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select item for preview" />
              </SelectTrigger>
              <SelectContent>
                {selectedItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <CardTitle className="text-center text-lg font-bold text-foreground">
          {labelData.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Product Image and SKU Row */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">SKU: {labelData.sku}</div>
          </div>
          <ProductImage 
            src={labelData.image_url} 
            alt={labelData.name}
            size="md"
            className="shrink-0"
          />
        </div>

        {/* Real Barcode */}
        <div className="space-y-1">
          <div className="flex justify-center">
            {barcodeImage ? (
              <img 
                src={barcodeImage} 
                alt="Barcode" 
                className="max-w-full h-auto"
                style={{ maxHeight: '40px' }}
              />
            ) : (
              <div className="bg-muted text-muted-foreground px-2 py-1 font-mono text-xs border border-border rounded">
                {loading ? 'Generating...' : 'No barcode'}
              </div>
            )}
          </div>
        </div>

        {/* Real QR Code */}
        <div className="flex justify-end">
          {qrCodeImage ? (
            <img 
              src={qrCodeImage} 
              alt="QR Code" 
              className="w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 bg-muted border border-border rounded flex items-center justify-center text-muted-foreground text-xs">
              QR
            </div>
          )}
        </div>

        {/* Lot and Expiration */}
        <div className="border-t border-border pt-2">
          <div className="font-semibold text-foreground">LOT: {labelData.lot_number}</div>
          <div className="font-semibold text-foreground">EXP: {new Date(labelData.expiration_date).toLocaleDateString()}</div>
        </div>

        {/* Nutritional Facts */}
        <div className="border-t border-border pt-2">
          <div className="font-bold text-sm text-foreground">Nutrition Facts</div>
          <div className="text-xs space-y-0.5 text-foreground">
            <div>Serving Size: {labelData.nutritional_info.servingSize}</div>
            <div className="font-semibold">Calories: {labelData.nutritional_info.calories}</div>
            <div>Total Fat: {labelData.nutritional_info.totalFat}g</div>
            <div>Sodium: {labelData.nutritional_info.sodium}mg</div>
            <div>Total Carbs: {labelData.nutritional_info.totalCarbs}g</div>
            <div>Protein: {labelData.nutritional_info.protein}g</div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="border-t border-border pt-2">
          <div className="font-bold text-foreground">INGREDIENTS:</div>
          <div className="text-xs leading-tight text-foreground">{labelData.ingredients}</div>
        </div>

        {/* Allergen Warning */}
        <div className="border-t border-border pt-2">
          <div className="font-bold text-foreground">ALLERGEN WARNING:</div>
          <div className="text-xs font-medium bg-warning/20 text-warning-foreground p-1 rounded border border-warning/40">
            Contains: {labelData.allergens}
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