import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Apple, Plus, X } from 'lucide-react';

interface NutritionalField {
  name: string;
  value: string;
  unit: string;
}

interface NutritionalData {
  serving_size: string;
  nutritional_fields: NutritionalField[];
}

interface NutritionalInfoFormProps {
  itemId: string;
  itemName: string;
  data: NutritionalData;
  onChange: (data: NutritionalData) => void;
}

export const NutritionalInfoForm: React.FC<NutritionalInfoFormProps> = ({ itemId, itemName, data, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState('');

  const availableFields = [
    { name: 'Calories', unit: 'kcal' },
    { name: 'Total Fat', unit: 'g' },
    { name: 'Saturated Fat', unit: 'g' },
    { name: 'Trans Fat', unit: 'g' },
    { name: 'Cholesterol', unit: 'mg' },
    { name: 'Sodium', unit: 'mg' },
    { name: 'Total Carbohydrates', unit: 'g' },
    { name: 'Dietary Fiber', unit: 'g' },
    { name: 'Total Sugars', unit: 'g' },
    { name: 'Added Sugars', unit: 'g' },
    { name: 'Protein', unit: 'g' },
    { name: 'Vitamin D', unit: 'mcg' },
    { name: 'Calcium', unit: 'mg' },
    { name: 'Iron', unit: 'mg' },
    { name: 'Potassium', unit: 'mg' },
    { name: 'Servings per Container', unit: 'servings' }
  ];

  const addNutritionalField = () => {
    if (!selectedFieldType) return;

    const fieldType = availableFields.find(f => f.name === selectedFieldType);
    if (!fieldType) return;

    // Check if field already exists
    const exists = (data.nutritional_fields || []).some(f => f.name === fieldType.name);
    if (exists) return;

    const newField: NutritionalField = {
      name: fieldType.name,
      value: '',
      unit: fieldType.unit
    };

    onChange({
      ...data,
      nutritional_fields: [...(data.nutritional_fields || []), newField]
    });

    setSelectedFieldType('');
  };

  const removeNutritionalField = (fieldName: string) => {
    onChange({
      ...data,
      nutritional_fields: (data.nutritional_fields || []).filter(f => f.name !== fieldName)
    });
  };

  const updateNutritionalField = (fieldName: string, value: string) => {
    onChange({
      ...data,
      nutritional_fields: (data.nutritional_fields || []).map(f => 
        f.name === fieldName ? { ...f, value } : f
      )
    });
  };

  const updateServingSize = (value: string) => {
    onChange({
      ...data,
      serving_size: value
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

  const getAvailableFields = () => {
    const existingFieldNames = (data.nutritional_fields || []).map(f => f.name);
    return availableFields.filter(f => !existingFieldNames.includes(f.name));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Apple className="h-5 w-5" />
          Nutritional Information - {itemName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Serving Size - Always Visible */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Serving Information</h3>
          <div className="space-y-2">
            <Label htmlFor="serving-size">Serving Size</Label>
            <Input
              id="serving-size"
              value={data.serving_size || ''}
              onChange={(e) => updateServingSize(e.target.value)}
              placeholder="e.g., 1 cup (240ml), 2 pieces, 100g"
            />
            <p className="text-xs text-muted-foreground">
              Specify the standard serving size for this item
            </p>
          </div>
        </div>

        <Separator />

        {/* Add Nutritional Field */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Nutritional Facts</h3>
            <div className="flex items-center gap-2">
              <Select value={selectedFieldType} onValueChange={setSelectedFieldType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Add nutritional field" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableFields().map(field => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.name} ({field.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                size="sm" 
                onClick={addNutritionalField}
                disabled={!selectedFieldType}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {(data.nutritional_fields || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Apple className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No nutritional fields added yet</p>
              <p className="text-xs">Use the dropdown above to add nutritional information</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data.nutritional_fields || []).map((field) => (
                <div key={field.name} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{field.name}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => updateNutritionalField(field.name, e.target.value)}
                      placeholder="0"
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground min-w-[40px]">
                      {field.unit}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNutritionalField(field.name)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          Changes will be saved when you save the item
        </div>
      </CardContent>
    </Card>
  );
};