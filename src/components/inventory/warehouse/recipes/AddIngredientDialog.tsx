import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Package, DollarSign } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { useAddIngredient } from '@/hooks/useRecipeIngredients';
import { getItemPackagingInfo } from '@/hooks/useRecipes';

interface AddIngredientDialogProps {
  recipeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddIngredientDialog: React.FC<AddIngredientDialogProps> = ({
  recipeId,
  open,
  onOpenChange,
}) => {
  const { items } = useInventory();
  const { mutate: addIngredient, isPending } = useAddIngredient();
  
  const [itemId, setItemId] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [unit, setUnit] = useState('');
  const [manualCost, setManualCost] = useState('');
  const [notes, setNotes] = useState('');
  const [packagingInfo, setPackagingInfo] = useState<{
    packagingInfo: string | null;
    costPerBaseUnit: number;
    baseUnit: string;
    purchasePrice: number | null;
    conversionFactor: number | null;
  } | null>(null);
  const [noPriceAvailable, setNoPriceAvailable] = useState(false);

  // Fetch item packaging info and price when item is selected
  useEffect(() => {
    if (!itemId) {
      setPackagingInfo(null);
      setNoPriceAvailable(false);
      setManualCost('');
      setUnit('');
      return;
    }

    (async () => {
      try {
        const info = await getItemPackagingInfo(itemId);
        setPackagingInfo(info);
        
        // Auto-fill unit with purchase unit from inventory
        setUnit(info.purchaseUnit || info.baseUnit || '');
        
        if (info.costPerBaseUnit > 0) {
          setNoPriceAvailable(false);
          setManualCost('');
        } else {
          setNoPriceAvailable(true);
        }
      } catch (error) {
        console.error('Error fetching packaging info:', error);
        setPackagingInfo(null);
        setNoPriceAvailable(true);
      }
    })();
  }, [itemId]);

  const handleAdd = () => {
    if (!itemId || !quantityNeeded || !unit || !packagingInfo) return;
    if (noPriceAvailable && !manualCost) return;

    const finalCost = noPriceAvailable ? parseFloat(manualCost) : null;

    // Use the mutation hook for proper cache invalidation
    addIngredient({
      recipe_id: recipeId,
      item_id: itemId,
      quantity_needed: parseFloat(quantityNeeded),
      unit,
      manual_unit_cost: finalCost !== null ? finalCost : null,
      cost_per_base_unit: packagingInfo.costPerBaseUnit,
      base_unit: packagingInfo.baseUnit,
      packaging_info: packagingInfo.packagingInfo,
      purchase_price_snapshot: packagingInfo.purchasePrice,
      conversion_factor_snapshot: packagingInfo.conversionFactor,
      sort_order: 0,
      notes: notes || null,
    }, {
      onSuccess: () => {
        // Reset form but keep dialog open for adding more ingredients
        setItemId('');
        setQuantityNeeded('');
        setUnit('');
        setManualCost('');
        setNotes('');
        setPackagingInfo(null);
        setNoPriceAvailable(false);
        // Don't close dialog - let user add more ingredients
      }
    });
  };

  const calculatedTotal = quantityNeeded && packagingInfo && (packagingInfo.costPerBaseUnit > 0 || manualCost)
    ? parseFloat(quantityNeeded) * (packagingInfo.costPerBaseUnit > 0 ? packagingInfo.costPerBaseUnit : parseFloat(manualCost))
    : 0;

  const canAdd = itemId && quantityNeeded && unit && (!noPriceAvailable || manualCost);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Inventory Item *</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Needed *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantityNeeded}
              onChange={(e) => setQuantityNeeded(e.target.value)}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="lbs"
              readOnly
              disabled
              className="bg-muted"
            />
            {packagingInfo && (
              <p className="text-xs text-muted-foreground">
                ✓ Using purchase unit from inventory
              </p>
            )}
          </div>

          {packagingInfo && packagingInfo.packagingInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-900">Packaging Info</p>
                  <p className="text-blue-700">{packagingInfo.packagingInfo}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    Cost Per {packagingInfo.baseUnit}: ${packagingInfo.costPerBaseUnit.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {noPriceAvailable && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-yellow-800 font-medium">
                    No purchase price set for this item
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="manualCost">Manual Unit Cost *</Label>
                    <Input
                      id="manualCost"
                      type="number"
                      step="0.01"
                      value={manualCost}
                      onChange={(e) => setManualCost(e.target.value)}
                      placeholder="12.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {calculatedTotal > 0 && (
            <div className="p-3 bg-primary/10 rounded-md">
              <div className="flex justify-between">
                <span className="font-medium">Ingredient Total:</span>
                <span className="text-lg font-bold text-primary">
                  ${calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!canAdd || isPending}
              className="flex-1"
            >
              {isPending ? 'Adding...' : 'Add Ingredient'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
