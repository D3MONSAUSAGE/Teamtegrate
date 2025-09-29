import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Utensils } from 'lucide-react';

export interface SimpleNutritionalData {
  ingredients: string;
  servingSize: string;
  calories: string;
  totalFat: string;
  sodium: string;
  totalCarbs: string;
  protein: string;
  allergens: string;
}

interface SimpleNutritionalFormProps {
  data: SimpleNutritionalData;
  onChange: (data: SimpleNutritionalData) => void;
  itemName?: string;
  showHeader?: boolean;
}

export const SimpleNutritionalForm: React.FC<SimpleNutritionalFormProps> = ({
  data,
  onChange,
  itemName,
  showHeader = true
}) => {
  const updateField = (field: keyof SimpleNutritionalData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const content = (
    <div className="space-y-4">
      {/* Ingredients */}
      <div>
        <Label htmlFor="ingredients" className="text-sm font-medium">Ingredients</Label>
        <Textarea
          id="ingredients"
          value={data.ingredients}
          onChange={(e) => updateField('ingredients', e.target.value)}
          placeholder="Enter ingredients list (e.g., Water, Sugar, Salt...)"
          className="mt-1 min-h-[80px]"
        />
      </div>

      {/* Allergens */}
      <div>
        <Label htmlFor="allergens" className="text-sm font-medium">Allergens</Label>
        <Input
          id="allergens"
          value={data.allergens}
          onChange={(e) => updateField('allergens', e.target.value)}
          placeholder="Contains: Milk, Eggs, Wheat..."
          className="mt-1"
        />
      </div>

      {/* Nutrition Facts */}
      <div className="space-y-3">
        <div className="font-medium text-sm">Nutrition Facts</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="serving-size" className="text-sm">Serving Size</Label>
            <Input
              id="serving-size"
              value={data.servingSize}
              onChange={(e) => updateField('servingSize', e.target.value)}
              placeholder="1 cup (240ml)"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="calories" className="text-sm">Calories</Label>
            <Input
              id="calories"
              value={data.calories}
              onChange={(e) => updateField('calories', e.target.value)}
              placeholder="150"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="total-fat" className="text-sm">Total Fat (g)</Label>
            <Input
              id="total-fat"
              value={data.totalFat}
              onChange={(e) => updateField('totalFat', e.target.value)}
              placeholder="5"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sodium" className="text-sm">Sodium (mg)</Label>
            <Input
              id="sodium"
              value={data.sodium}
              onChange={(e) => updateField('sodium', e.target.value)}
              placeholder="200"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="total-carbs" className="text-sm">Total Carbs (g)</Label>
            <Input
              id="total-carbs"
              value={data.totalCarbs}
              onChange={(e) => updateField('totalCarbs', e.target.value)}
              placeholder="30"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="protein" className="text-sm">Protein (g)</Label>
            <Input
              id="protein"
              value={data.protein}
              onChange={(e) => updateField('protein', e.target.value)}
              placeholder="8"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="h-5 w-5 text-primary" />
          Nutritional Information
          {itemName && ` - ${itemName}`}
        </CardTitle>
        <CardDescription>
          Enter nutritional information and ingredients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

// Helper function to convert simple data to database format
export const convertSimpleToFlat = (simpleData: SimpleNutritionalData) => ({
  ingredients: simpleData.ingredients || '',
  allergens: simpleData.allergens ? simpleData.allergens.split(',').map(a => a.trim()).filter(a => a) : [],
  serving_size: simpleData.servingSize || '',
  calories: simpleData.calories ? parseFloat(simpleData.calories) || null : null,
  total_fat: simpleData.totalFat ? parseFloat(simpleData.totalFat) || null : null,
  sodium: simpleData.sodium ? parseFloat(simpleData.sodium) || null : null,
  total_carbohydrates: simpleData.totalCarbs ? parseFloat(simpleData.totalCarbs) || null : null,
  protein: simpleData.protein ? parseFloat(simpleData.protein) || null : null,
});

// Helper function to convert database format to simple data
export const convertFlatToSimple = (flatData: any): SimpleNutritionalData => ({
  ingredients: flatData?.ingredients || '',
  allergens: Array.isArray(flatData?.allergens) ? flatData.allergens.join(', ') : '',
  servingSize: flatData?.serving_size || '',
  calories: flatData?.calories ? String(flatData.calories) : '',
  totalFat: flatData?.total_fat ? String(flatData.total_fat) : '',
  sodium: flatData?.sodium ? String(flatData.sodium) : '',
  totalCarbs: flatData?.total_carbohydrates ? String(flatData.total_carbohydrates) : '',
  protein: flatData?.protein ? String(flatData.protein) : '',
});