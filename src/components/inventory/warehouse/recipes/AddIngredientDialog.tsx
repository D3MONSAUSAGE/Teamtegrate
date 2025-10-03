import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { useAddIngredient } from '@/hooks/useRecipeIngredients';
import { teamItemPricingApi } from '@/contexts/inventory/api/teamItemPricing';

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
  const [autoCost, setAutoCost] = useState<number | null>(null);
  const [noPriceAvailable, setNoPriceAvailable] = useState(false);

  // Fetch item price when item is selected
  useEffect(() => {
    if (!itemId) {
      setAutoCost(null);
      setNoPriceAvailable(false);
      setManualCost('');
      return;
    }

    (async () => {
      try {
        const pricing = await teamItemPricingApi.getEffectivePricing(itemId);
        if (pricing.purchase_price) {
          setAutoCost(pricing.purchase_price);
          setNoPriceAvailable(false);
          setManualCost(''); // Clear manual cost when auto-cost is available
        } else {
          setAutoCost(null);
          setNoPriceAvailable(true);
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
        setAutoCost(null);
        setNoPriceAvailable(true);
      }
    })();
  }, [itemId]);

  const handleAdd = () => {
    if (!itemId || !quantityNeeded || !unit) return;
    if (noPriceAvailable && !manualCost) return;

    const finalCost = noPriceAvailable ? parseFloat(manualCost) : null;

    addIngredient(
      {
        recipe_id: recipeId,
        item_id: itemId,
        quantity_needed: parseFloat(quantityNeeded),
        unit,
        manual_unit_cost: finalCost !== null ? finalCost : undefined,
        sort_order: 0,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setItemId('');
          setQuantityNeeded('');
          setUnit('');
          setManualCost('');
          setNotes('');
          setAutoCost(null);
          setNoPriceAvailable(false);
          onOpenChange(false);
        },
      }
    );
  };

  const calculatedTotal = quantityNeeded && (autoCost !== null || manualCost)
    ? parseFloat(quantityNeeded) * (autoCost !== null ? autoCost : parseFloat(manualCost))
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
            />
          </div>

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

          {autoCost !== null && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span>Unit Cost (from inventory):</span>
                <span className="font-medium">${autoCost.toFixed(2)}</span>
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
