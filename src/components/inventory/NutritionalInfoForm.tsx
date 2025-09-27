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

interface NutritionalInfoFormProps {
  itemId: string;
  itemName: string;
}

export const NutritionalInfoForm: React.FC<NutritionalInfoFormProps> = ({ itemId, itemName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
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
    ingredients: '',
    allergens: [] as string[],
    additional_nutrients: {}
  });

  const [allergenInput, setAllergenInput] = useState('');

  const commonAllergens = [
    'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts', 'Wheat', 'Soybeans'
  ];

  useEffect(() => {
    loadNutritionalInfo();
  }, [itemId]);

  const loadNutritionalInfo = async () => {
    try {
      setLoading(true);
      const info = await nutritionalInfoApi.getByItemId(itemId);
      if (info) {
        setFormData({
          serving_size: info.serving_size || '',
          servings_per_container: info.servings_per_container || 0,
          calories: info.calories || 0,
          total_fat: info.total_fat || 0,
          saturated_fat: info.saturated_fat || 0,
          trans_fat: info.trans_fat || 0,
          cholesterol: info.cholesterol || 0,
          sodium: info.sodium || 0,
          total_carbohydrates: info.total_carbohydrates || 0,
          dietary_fiber: info.dietary_fiber || 0,
          total_sugars: info.total_sugars || 0,
          added_sugars: info.added_sugars || 0,
          protein: info.protein || 0,
          vitamin_d: info.vitamin_d || 0,
          calcium: info.calcium || 0,
          iron: info.iron || 0,
          potassium: info.potassium || 0,
          ingredients: info.ingredients || '',
          allergens: info.allergens || [],
          additional_nutrients: info.additional_nutrients || {}
        });
      }
    } catch (error) {
      console.error('Error loading nutritional info:', error);
      toast.error('Failed to load nutritional information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const nutritionalData = {
        organization_id: '', // Will be set by RLS
        item_id: itemId,
        serving_size: formData.serving_size || null,
        servings_per_container: formData.servings_per_container || null,
        calories: formData.calories || null,
        total_fat: formData.total_fat || null,
        saturated_fat: formData.saturated_fat || null,
        trans_fat: formData.trans_fat || null,
        cholesterol: formData.cholesterol || null,
        sodium: formData.sodium || null,
        total_carbohydrates: formData.total_carbohydrates || null,
        dietary_fiber: formData.dietary_fiber || null,
        total_sugars: formData.total_sugars || null,
        added_sugars: formData.added_sugars || null,
        protein: formData.protein || null,
        vitamin_d: formData.vitamin_d || null,
        calcium: formData.calcium || null,
        iron: formData.iron || null,
        potassium: formData.potassium || null,
        ingredients: formData.ingredients || null,
        allergens: formData.allergens.length > 0 ? formData.allergens : null,
        additional_nutrients: formData.additional_nutrients,
        created_by: '' // Will be set by auth
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

  const addAllergen = (allergen: string) => {
    if (allergen && !formData.allergens.includes(allergen)) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergen]
      }));
    }
    setAllergenInput('');
  };

  const removeAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
                value={formData.serving_size}
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
                value={formData.servings_per_container}
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
                value={formData.calories}
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
                value={formData.total_fat}
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
                value={formData.saturated_fat}
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
                value={formData.cholesterol}
                onChange={(e) => updateField('cholesterol', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sodium">Sodium (mg)</Label>
              <Input
                id="sodium"
                type="number"
                min="0"
                value={formData.sodium}
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
                value={formData.total_carbohydrates}
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
                value={formData.dietary_fiber}
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
                value={formData.total_sugars}
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
                value={formData.protein}
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
                value={formData.vitamin_d}
                onChange={(e) => updateField('vitamin_d', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calcium">Calcium (mg)</Label>
              <Input
                id="calcium"
                type="number"
                min="0"
                value={formData.calcium}
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
                value={formData.iron}
                onChange={(e) => updateField('iron', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (mg)</Label>
              <Input
                id="potassium"
                type="number"
                min="0"
                value={formData.potassium}
                onChange={(e) => updateField('potassium', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Ingredients */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Ingredients</h3>
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients List</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => updateField('ingredients', e.target.value)}
              placeholder="List ingredients in descending order by weight"
              rows={3}
            />
          </div>
        </div>

        {/* Allergens */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Allergens</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {commonAllergens.map((allergen) => (
                <Button
                  key={allergen}
                  type="button"
                  variant={formData.allergens.includes(allergen) ? "default" : "outline"}
                  size="sm"
                  onClick={() => formData.allergens.includes(allergen) ? removeAllergen(allergen) : addAllergen(allergen)}
                >
                  {allergen}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={allergenInput}
                onChange={(e) => setAllergenInput(e.target.value)}
                placeholder="Add custom allergen"
                onKeyPress={(e) => e.key === 'Enter' && addAllergen(allergenInput)}
              />
              <Button type="button" variant="outline" onClick={() => addAllergen(allergenInput)}>
                Add
              </Button>
            </div>

            {formData.allergens.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergens.map((allergen) => (
                  <Badge key={allergen} variant="secondary" className="flex items-center gap-1">
                    {allergen}
                    <button 
                      onClick={() => removeAllergen(allergen)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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