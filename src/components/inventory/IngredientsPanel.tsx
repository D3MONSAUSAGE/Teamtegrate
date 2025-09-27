import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LeafyGreen, Save } from 'lucide-react';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { toast } from 'sonner';

interface IngredientsPanelProps {
  itemId: string;
  itemName: string;
}

export const IngredientsPanel: React.FC<IngredientsPanelProps> = ({ itemId, itemName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    ingredients: '',
    allergens: [] as string[]
  });

  const [allergenInput, setAllergenInput] = useState('');

  const commonAllergens = [
    'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts', 'Wheat', 'Soybeans'
  ];

  useEffect(() => {
    loadIngredientsData();
  }, [itemId]);

  const loadIngredientsData = async () => {
    try {
      setLoading(true);
      const info = await nutritionalInfoApi.getByItemId(itemId);
      if (info) {
        setFormData({
          ingredients: info.ingredients || '',
          allergens: info.allergens || []
        });
      }
    } catch (error) {
      console.error('Error loading ingredients data:', error);
      toast.error('Failed to load ingredients information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get existing nutritional info to preserve other data
      const existingInfo = await nutritionalInfoApi.getByItemId(itemId);
      
      const nutritionalData = {
        organization_id: '', // Will be set by RLS
        item_id: itemId,
        // Preserve existing nutritional values
        serving_size: existingInfo?.serving_size || null,
        servings_per_container: existingInfo?.servings_per_container || null,
        calories: existingInfo?.calories || null,
        total_fat: existingInfo?.total_fat || null,
        saturated_fat: existingInfo?.saturated_fat || null,
        trans_fat: existingInfo?.trans_fat || null,
        cholesterol: existingInfo?.cholesterol || null,
        sodium: existingInfo?.sodium || null,
        total_carbohydrates: existingInfo?.total_carbohydrates || null,
        dietary_fiber: existingInfo?.dietary_fiber || null,
        total_sugars: existingInfo?.total_sugars || null,
        added_sugars: existingInfo?.added_sugars || null,
        protein: existingInfo?.protein || null,
        vitamin_d: existingInfo?.vitamin_d || null,
        calcium: existingInfo?.calcium || null,
        iron: existingInfo?.iron || null,
        potassium: existingInfo?.potassium || null,
        // Update ingredients and allergens
        ingredients: formData.ingredients || null,
        allergens: formData.allergens.length > 0 ? formData.allergens : null,
        additional_nutrients: existingInfo?.additional_nutrients || {},
        created_by: '' // Will be set by auth
      };

      await nutritionalInfoApi.upsert(nutritionalData);
      toast.success('Ingredients information saved successfully');
    } catch (error) {
      console.error('Error saving ingredients info:', error);
      toast.error('Failed to save ingredients information');
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading ingredients information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LeafyGreen className="h-5 w-5" />
          Ingredients & Allergens - {itemName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ingredients */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Ingredients</h3>
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients List</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => updateField('ingredients', e.target.value)}
              placeholder="List ingredients in descending order by weight (e.g., Water, Sugar, Wheat Flour, Salt...)"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              List ingredients in order from highest to lowest quantity by weight
            </p>
          </div>
        </div>

        <Separator />

        {/* Allergens */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Allergens</h3>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Select common allergens or add custom ones
            </p>
            
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
              <div className="space-y-2">
                <Label>Selected Allergens</Label>
                <div className="flex flex-wrap gap-2">
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
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Ingredients'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};