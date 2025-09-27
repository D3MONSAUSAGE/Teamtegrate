import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Apple, Save, AlertCircle } from 'lucide-react';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { toast } from 'sonner';

interface NutritionalData {
  serving_size: string;
  servings_per_container: number;
  calories: number;
  total_fat: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol: number;
  sodium: number;
  total_carbohydrates: number;
  dietary_fiber: number;
  total_sugars: number;
  added_sugars: number;
  protein: number;
  vitamin_d: number;
  calcium: number;
  iron: number;
  potassium: number;
  additional_nutrients: any;
}

interface NutritionalInfoFormProps {
  itemId: string;
  itemName: string;
  data: NutritionalData;
  onChange: (data: NutritionalData) => void;
}

export const NutritionalInfoForm: React.FC<NutritionalInfoFormProps> = ({ itemId, itemName, data, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get existing ingredients info to preserve
      const existingInfo = await nutritionalInfoApi.getByItemId(itemId);
      
      const nutritionalData = {
        item_id: itemId,
        serving_size: data.serving_size || null,
        servings_per_container: data.servings_per_container || null,
        calories: data.calories || null,
        total_fat: data.total_fat || null,
        saturated_fat: data.saturated_fat || null,
        trans_fat: data.trans_fat || null,
        cholesterol: data.cholesterol || null,
        sodium: data.sodium || null,
        total_carbohydrates: data.total_carbohydrates || null,
        dietary_fiber: data.dietary_fiber || null,
        total_sugars: data.total_sugars || null,
        added_sugars: data.added_sugars || null,
        protein: data.protein || null,
        vitamin_d: data.vitamin_d || null,
        calcium: data.calcium || null,
        iron: data.iron || null,
        potassium: data.potassium || null,
        // Preserve ingredients and allergens from existing data (managed by ingredients tab)
        ingredients: existingInfo?.ingredients || null,
        allergens: existingInfo?.allergens || null,
        additional_nutrients: data.additional_nutrients
      };

      await nutritionalInfoApi.upsert(nutritionalData);
      toast.success('Nutritional information saved successfully');
    } catch (error) {
      console.error('Error saving nutritional info:', error);
      toast.error('Failed to save nutritional information');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string | number) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading nutritional information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Apple className="h-5 w-5" />
          Nutritional Information - {itemName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Serving Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Serving Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serving-size">Serving Size</Label>
              <Input
                id="serving-size"
                value={data.serving_size}
                onChange={(e) => updateField('serving_size', e.target.value)}
                placeholder="e.g., 1 cup (240ml)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings-per-container">Servings per Container</Label>
              <Input
                id="servings-per-container"
                type="number"
                min="0"
                step="0.1"
                value={data.servings_per_container}
                onChange={(e) => updateField('servings_per_container', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Nutrition Facts */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Nutrition Facts (per serving)</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                value={data.calories}
                onChange={(e) => updateField('calories', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-fat">Total Fat (g)</Label>
              <Input
                id="total-fat"
                type="number"
                min="0"
                step="0.1"
                value={data.total_fat}
                onChange={(e) => updateField('total_fat', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saturated-fat">Saturated Fat (g)</Label>
              <Input
                id="saturated-fat"
                type="number"
                min="0"
                step="0.1"
                value={data.saturated_fat}
                onChange={(e) => updateField('saturated_fat', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cholesterol">Cholesterol (mg)</Label>
              <Input
                id="cholesterol"
                type="number"
                min="0"
                value={data.cholesterol}
                onChange={(e) => updateField('cholesterol', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sodium">Sodium (mg)</Label>
              <Input
                id="sodium"
                type="number"
                min="0"
                value={data.sodium}
                onChange={(e) => updateField('sodium', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-carbs">Total Carbohydrates (g)</Label>
              <Input
                id="total-carbs"
                type="number"
                min="0"
                step="0.1"
                value={data.total_carbohydrates}
                onChange={(e) => updateField('total_carbohydrates', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dietary-fiber">Dietary Fiber (g)</Label>
              <Input
                id="dietary-fiber"
                type="number"
                min="0"
                step="0.1"
                value={data.dietary_fiber}
                onChange={(e) => updateField('dietary_fiber', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-sugars">Total Sugars (g)</Label>
              <Input
                id="total-sugars"
                type="number"
                min="0"
                step="0.1"
                value={data.total_sugars}
                onChange={(e) => updateField('total_sugars', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                min="0"
                step="0.1"
                value={data.protein}
                onChange={(e) => updateField('protein', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Vitamins & Minerals */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Vitamins & Minerals</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vitamin-d">Vitamin D (mcg)</Label>
              <Input
                id="vitamin-d"
                type="number"
                min="0"
                step="0.1"
                value={data.vitamin_d}
                onChange={(e) => updateField('vitamin_d', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calcium">Calcium (mg)</Label>
              <Input
                id="calcium"
                type="number"
                min="0"
                value={data.calcium}
                onChange={(e) => updateField('calcium', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iron">Iron (mg)</Label>
              <Input
                id="iron"
                type="number"
                min="0"
                step="0.1"
                value={data.iron}
                onChange={(e) => updateField('iron', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (mg)</Label>
              <Input
                id="potassium"
                type="number"
                min="0"
                value={data.potassium}
                onChange={(e) => updateField('potassium', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>


        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Nutritional Info'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};