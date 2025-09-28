import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { InventoryItem } from '@/contexts/inventory/types';
import { CSVNutritionImport } from './CSVNutritionImport';
import { toast } from 'sonner';
import { Save, Plus, AlertTriangle, ChevronDown, FileSpreadsheet } from 'lucide-react';

interface NutritionalDataFormProps {
  selectedItem: InventoryItem;
  nutritionalInfo: NutritionalInfo | null;
  onDataSaved: (data: NutritionalInfo) => void;
}

const COMMON_ALLERGENS = [
  'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts', 'Wheat', 'Soybeans', 'Sesame'
];

export const NutritionalDataForm: React.FC<NutritionalDataFormProps> = ({
  selectedItem,
  nutritionalInfo,
  onDataSaved
}) => {
  const [formData, setFormData] = useState<Partial<NutritionalInfo>>({
    serving_size: '',
    servings_per_container: undefined,
    calories: undefined,
    total_fat: undefined,
    saturated_fat: undefined,
    trans_fat: undefined,
    cholesterol: undefined,
    sodium: undefined,
    total_carbohydrates: undefined,
    dietary_fiber: undefined,
    total_sugars: undefined,
    added_sugars: undefined,
    protein: undefined,
    vitamin_d: undefined,
    calcium: undefined,
    iron: undefined,
    potassium: undefined,
    ingredients: '',
    allergens: [],
    additional_nutrients: {}
  });

  const [customAllergen, setCustomAllergen] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (nutritionalInfo) {
      setFormData({
        serving_size: nutritionalInfo.serving_size || '',
        servings_per_container: nutritionalInfo.servings_per_container,
        calories: nutritionalInfo.calories,
        total_fat: nutritionalInfo.total_fat,
        saturated_fat: nutritionalInfo.saturated_fat,
        trans_fat: nutritionalInfo.trans_fat,
        cholesterol: nutritionalInfo.cholesterol,
        sodium: nutritionalInfo.sodium,
        total_carbohydrates: nutritionalInfo.total_carbohydrates,
        dietary_fiber: nutritionalInfo.dietary_fiber,
        total_sugars: nutritionalInfo.total_sugars,
        added_sugars: nutritionalInfo.added_sugars,
        protein: nutritionalInfo.protein,
        vitamin_d: nutritionalInfo.vitamin_d,
        calcium: nutritionalInfo.calcium,
        iron: nutritionalInfo.iron,
        potassium: nutritionalInfo.potassium,
        ingredients: nutritionalInfo.ingredients || '',
        allergens: nutritionalInfo.allergens || [],
        additional_nutrients: nutritionalInfo.additional_nutrients || {}
      });
    }
  }, [nutritionalInfo]);

  const handleFieldChange = (field: keyof NutritionalInfo, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const addAllergen = (allergen: string) => {
    if (allergen && !formData.allergens?.includes(allergen)) {
      setFormData(prev => ({
        ...prev,
        allergens: [...(prev.allergens || []), allergen]
      }));
    }
  };

  const removeAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens?.filter(a => a !== allergen) || []
    }));
  };

  const addCustomAllergen = () => {
    if (customAllergen.trim()) {
      addAllergen(customAllergen.trim());
      setCustomAllergen('');
    }
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        item_id: selectedItem.id
      };

      const result = await nutritionalInfoApi.upsert(dataToSave as any);
      onDataSaved(result);
      toast.success('Nutritional information saved successfully!');
    } catch (error) {
      console.error('Error saving nutritional info:', error);
      toast.error('Failed to save nutritional information');
    } finally {
      setIsSaving(false);
    }
  };

  const hasRequiredData = formData.serving_size && (formData.calories || formData.ingredients);

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-primary/10 rounded">
              <Save className="h-4 w-4 text-primary" />
            </div>
            Step 3: Nutritional Information
          </CardTitle>
          <CardDescription>
            Enter nutritional data for <strong>{selectedItem.name}</strong> to show real information on labels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="import">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Bulk Import
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-6">
              {/* Manual entry form content */}
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serving_size">Serving Size</Label>
                  <Input
                    id="serving_size"
                    placeholder="e.g., 1 cup (240ml)"
                    value={formData.serving_size || ''}
                    onChange={(e) => handleFieldChange('serving_size', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="servings_per_container">Servings per Container</Label>
                  <Input
                    id="servings_per_container"
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.servings_per_container || ''}
                    onChange={(e) => handleFieldChange('servings_per_container', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>

              <Separator />

              {/* Main Nutrients */}
              <div>
                <h4 className="font-semibold mb-3">Main Nutrients (per serving)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="250"
                      value={formData.calories || ''}
                      onChange={(e) => handleFieldChange('calories', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_fat">Total Fat (g)</Label>
                    <Input
                      id="total_fat"
                      type="number"
                      step="0.1"
                      placeholder="12"
                      value={formData.total_fat || ''}
                      onChange={(e) => handleFieldChange('total_fat', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sodium">Sodium (mg)</Label>
                    <Input
                      id="sodium"
                      type="number"
                      placeholder="350"
                      value={formData.sodium || ''}
                      onChange={(e) => handleFieldChange('sodium', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_carbohydrates">Total Carbs (g)</Label>
                    <Input
                      id="total_carbohydrates"
                      type="number"
                      step="0.1"
                      placeholder="28"
                      value={formData.total_carbohydrates || ''}
                      onChange={(e) => handleFieldChange('total_carbohydrates', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      placeholder="15"
                      value={formData.protein || ''}
                      onChange={(e) => handleFieldChange('protein', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dietary_fiber">Dietary Fiber (g)</Label>
                    <Input
                      id="dietary_fiber"
                      type="number"
                      step="0.1"
                      placeholder="3"
                      value={formData.dietary_fiber || ''}
                      onChange={(e) => handleFieldChange('dietary_fiber', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ingredients */}
              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea
                  id="ingredients"
                  placeholder="Enter ingredients in order of quantity (most to least)..."
                  value={formData.ingredients || ''}
                  onChange={(e) => handleFieldChange('ingredients', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Allergens */}
              <div>
                <Label>Allergens</Label>
                <div className="space-y-3">
                  {/* Common Allergens */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Common allergens (click to add):</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_ALLERGENS.map(allergen => (
                        <Button
                          key={allergen}
                          type="button"
                          variant={formData.allergens?.includes(allergen) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            formData.allergens?.includes(allergen) 
                              ? removeAllergen(allergen)
                              : addAllergen(allergen)
                          }
                        >
                          {allergen}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Allergen Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom allergen..."
                      value={customAllergen}
                      onChange={(e) => setCustomAllergen(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergen())}
                    />
                    <Button type="button" onClick={addCustomAllergen} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selected Allergens */}
                  {formData.allergens && formData.allergens.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Selected allergens:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.allergens.map(allergen => (
                          <Badge key={allergen} variant="secondary" className="cursor-pointer">
                            {allergen}
                            <button
                              type="button"
                              onClick={() => removeAllergen(allergen)}
                              className="ml-1 text-xs hover:text-destructive"
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

              <Separator />

              {/* Save Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!hasRequiredData && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Add serving size and either calories or ingredients for basic labels
                    </div>
                  )}
                </div>
                <Button onClick={handleSave} disabled={isSaving || !hasRequiredData}>
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Nutritional Data
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="import">
              <CSVNutritionImport 
                onImportComplete={() => {
                  // Refresh the current item's nutritional data
                  if (selectedItem) {
                    nutritionalInfoApi.getByItemId(selectedItem.id)
                      .then(data => {
                        if (data) onDataSaved(data);
                      });
                  }
                  toast.success('Nutritional data imported successfully!');
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};