import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LeafyGreen } from 'lucide-react';

interface IngredientsData {
  ingredients: string;
  allergens: string[];
}

interface IngredientsPanelProps {
  itemId: string;
  itemName: string;
  data: IngredientsData;
  onChange: (data: IngredientsData) => void;
}

export const IngredientsPanel: React.FC<IngredientsPanelProps> = ({ itemId, itemName, data, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [allergenInput, setAllergenInput] = useState('');

  const commonAllergens = [
    'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts', 'Wheat', 'Soybeans'
  ];

  const addAllergen = (allergen: string) => {
    if (allergen && !data.allergens.includes(allergen)) {
      onChange({
        ...data,
        allergens: [...data.allergens, allergen]
      });
    }
    setAllergenInput('');
  };

  const removeAllergen = (allergen: string) => {
    onChange({
      ...data,
      allergens: data.allergens.filter(a => a !== allergen)
    });
  };

  const updateField = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
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
              value={data.ingredients}
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
                  variant={data.allergens.includes(allergen) ? "default" : "outline"}
                  size="sm"
                  onClick={() => data.allergens.includes(allergen) ? removeAllergen(allergen) : addAllergen(allergen)}
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

            {data.allergens.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Allergens</Label>
                <div className="flex flex-wrap gap-2">
                  {data.allergens.map((allergen) => (
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

        <div className="text-sm text-muted-foreground text-center">
          Changes will be saved when you save the item
        </div>
      </CardContent>
    </Card>
  );
};