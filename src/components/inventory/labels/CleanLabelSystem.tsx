import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { InventoryItem } from '@/contexts/inventory/types';
import { FoodLabelPreview } from './FoodLabelPreview';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { Package, FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  includes: {
    barcode: boolean;
    nutrition: boolean;
    ingredients: boolean;
    allergens: boolean;
  };
}

// Simple, clean templates
const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Product Label',
    description: 'Name + SKU + Barcode',
    includes: { barcode: true, nutrition: false, ingredients: false, allergens: false }
  },
  {
    id: 'food',
    name: 'Food Label',
    description: 'Complete food label with nutrition, ingredients, allergens',
    includes: { barcode: true, nutrition: true, ingredients: true, allergens: true }
  },
  {
    id: 'barcode-only',
    name: 'Simple Barcode Label',
    description: 'Just barcode + item name',
    includes: { barcode: true, nutrition: false, ingredients: false, allergens: false }
  }
];

export const CleanLabelSystem: React.FC = () => {
  const { items } = useEnhancedInventoryManagement();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('food');
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Simple nutritional form state
  const [nutritionForm, setNutritionForm] = useState({
    serving_size: '',
    calories: '',
    total_fat: '',
    sodium: '',
    total_carbohydrates: '',
    protein: '',
    ingredients: '',
    allergens: [] as string[]
  });

  // Load item when selected
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      setSelectedItem(item || null);
      
      if (item) {
        loadNutritionalInfo(item.id);
      }
    } else {
      setSelectedItem(null);
      setNutritionalInfo(null);
    }
  }, [selectedItemId, items]);

  const loadNutritionalInfo = async (itemId: string) => {
    try {
      const data = await nutritionalInfoApi.getByItemId(itemId);
      setNutritionalInfo(data);
      
      if (data) {
        setNutritionForm({
          serving_size: data.serving_size || '',
          calories: data.calories?.toString() || '',
          total_fat: data.total_fat?.toString() || '',
          sodium: data.sodium?.toString() || '',
          total_carbohydrates: data.total_carbohydrates?.toString() || '',
          protein: data.protein?.toString() || '',
          ingredients: data.ingredients || '',
          allergens: data.allergens || []
        });
      }
    } catch (error) {
      console.error('Failed to load nutritional info:', error);
    }
  };

  const saveNutritionalInfo = async () => {
    if (!selectedItem) return;

    try {
      const payload = {
        item_id: selectedItem.id,
        serving_size: nutritionForm.serving_size || null,
        calories: nutritionForm.calories ? Number(nutritionForm.calories) : null,
        total_fat: nutritionForm.total_fat ? Number(nutritionForm.total_fat) : null,
        sodium: nutritionForm.sodium ? Number(nutritionForm.sodium) : null,
        total_carbohydrates: nutritionForm.total_carbohydrates ? Number(nutritionForm.total_carbohydrates) : null,
        protein: nutritionForm.protein ? Number(nutritionForm.protein) : null,
        ingredients: nutritionForm.ingredients || null,
        allergens: nutritionForm.allergens.length > 0 ? nutritionForm.allergens : null
      };

      if (nutritionalInfo) {
        await nutritionalInfoApi.update(selectedItem.id, payload);
      } else {
        await nutritionalInfoApi.create(payload);
      }
      
      toast.success('Nutritional info saved successfully!');
      loadNutritionalInfo(selectedItem.id);
    } catch (error) {
      console.error('Failed to save nutritional info:', error);
      toast.error('Failed to save nutritional info');
    }
  };

  const generateLabel = async () => {
    if (!selectedItem) {
      toast.error('Please select a product first');
      return;
    }

    const template = LABEL_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6] // 4x6 inch label
      });

      pdf.setFont('helvetica');
      let y = 0.5;

      // Product Name (always included)
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedItem.name.toUpperCase(), 2, y, { align: 'center' });
      y += 0.4;

      // SKU (always included)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`SKU: ${selectedItem.sku || 'N/A'}`, 0.2, y);
      y += 0.3;

      // Barcode (always included - non-optional as requested)
      if (template.includes.barcode) {
        try {
          const barcodeValue = selectedItem.barcode || selectedItem.sku || selectedItem.id;
          const barcodeImage = BarcodeGenerator.generateBarcode(barcodeValue, {
            format: 'CODE128',
            width: 2,
            height: 40,
            displayValue: true,
            background: '#ffffff',
            lineColor: '#000000'
          });
          
          if (barcodeImage) {
            pdf.addImage(barcodeImage, 'PNG', 0.5, y, 3, 0.6);
            y += 0.8;
          }
        } catch (error) {
          console.error('Barcode generation failed:', error);
        }
      }

      // Nutrition Facts
      if (template.includes.nutrition && nutritionalInfo) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nutrition Facts', 0.2, y);
        y += 0.25;

        pdf.setLineWidth(0.02);
        pdf.rect(0.2, y, 3.6, 1.5);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        y += 0.2;

        const nutritionItems = [
          { label: 'Serving Size', value: nutritionalInfo.serving_size },
          { label: 'Calories', value: nutritionalInfo.calories, bold: true },
          { label: 'Total Fat', value: nutritionalInfo.total_fat, unit: 'g' },
          { label: 'Sodium', value: nutritionalInfo.sodium, unit: 'mg' },
          { label: 'Total Carbs', value: nutritionalInfo.total_carbohydrates, unit: 'g' },
          { label: 'Protein', value: nutritionalInfo.protein, unit: 'g' },
        ];

        nutritionItems.forEach(item => {
          if (item.value !== null && item.value !== undefined) {
            pdf.setFont('helvetica', item.bold ? 'bold' : 'normal');
            const text = `${item.label}: ${item.value}${item.unit || ''}`;
            pdf.text(text, 0.3, y);
            y += 0.15;
          }
        });
        
        y += 0.2;
      }

      // Ingredients
      if (template.includes.ingredients && nutritionalInfo?.ingredients) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INGREDIENTS:', 0.2, y);
        y += 0.2;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const ingredients = pdf.splitTextToSize(nutritionalInfo.ingredients, 3.6);
        pdf.text(ingredients, 0.2, y);
        y += (ingredients.length * 0.1) + 0.2;
      }

      // Allergens
      if (template.includes.allergens && nutritionalInfo?.allergens?.length) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALLERGEN WARNING:', 0.2, y);
        y += 0.2;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Contains: ${nutritionalInfo.allergens.join(', ')}`, 0.2, y);
      }

      // Footer
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 2, 5.8, { align: 'center' });

      // Save with clean filename
      const filename = `label-${selectedItem.name.replace(/[^a-zA-Z0-9]/g, '-')}-${template.id}.pdf`;
      pdf.save(filename);
      
      toast.success('Label generated successfully!');
      
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentTemplate = LABEL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Simple Label System</h1>
        <p className="text-muted-foreground">
          Easy barcode labels for your products - always includes barcode as requested
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Configuration Panel */}
        <div className="space-y-6">
          
          {/* Step 1: Select Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Step 1: Select Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {item.sku || 'No SKU'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Step 2: Choose Template */}
          {selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Step 2: Choose Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {LABEL_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                      <div className="flex gap-1 mt-2">
                        {template.includes.barcode && <Badge variant="outline" className="text-xs">Barcode</Badge>}
                        {template.includes.nutrition && <Badge variant="outline" className="text-xs">Nutrition</Badge>}
                        {template.includes.ingredients && <Badge variant="outline" className="text-xs">Ingredients</Badge>}
                        {template.includes.allergens && <Badge variant="outline" className="text-xs">Allergens</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Nutritional Info Status */}
          {selectedItem && currentTemplate && (currentTemplate.includes.nutrition || currentTemplate.includes.ingredients || currentTemplate.includes.allergens) && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Nutritional Information</CardTitle>
                {nutritionalInfo ? (
                  <CardDescription className="text-green-600 font-medium flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    Using existing nutritional data from product profile
                  </CardDescription>
                ) : (
                  <CardDescription>
                    No nutritional data found - you can add it below or generate label without it
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                
                {nutritionalInfo ? (
                  <div className="space-y-4">
                    {/* Show existing data summary */}
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                      <h4 className="font-medium text-sm text-foreground">Current Data:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {nutritionalInfo.serving_size && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Serving Size:</span> 
                            <span className="font-medium">{nutritionalInfo.serving_size}</span>
                          </div>
                        )}
                        {nutritionalInfo.calories && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Calories:</span> 
                            <span className="font-medium">{nutritionalInfo.calories}</span>
                          </div>
                        )}
                        {nutritionalInfo.total_fat && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Fat:</span> 
                            <span className="font-medium">{nutritionalInfo.total_fat}g</span>
                          </div>
                        )}
                        {nutritionalInfo.protein && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protein:</span> 
                            <span className="font-medium">{nutritionalInfo.protein}g</span>
                          </div>
                        )}
                      </div>
                      
                      {nutritionalInfo.ingredients && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground text-sm">Ingredients: </span>
                          <span className="text-sm">{nutritionalInfo.ingredients.slice(0, 120)}{nutritionalInfo.ingredients.length > 120 ? '...' : ''}</span>
                        </div>
                      )}
                      
                      {nutritionalInfo.allergens?.length && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-muted-foreground text-sm">Allergens:</span>
                          {nutritionalInfo.allergens.map(allergen => (
                            <Badge key={allergen} variant="secondary" className="text-xs">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setNutritionalInfo(null);
                          // Clear form to show input fields
                          setNutritionForm({
                            serving_size: '',
                            calories: '',
                            total_fat: '',
                            sodium: '',
                            total_carbohydrates: '',
                            protein: '',
                            ingredients: '',
                            allergens: []
                          });
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        Edit Nutrition Data
                      </Button>
                      <Button 
                        onClick={generateLabel} 
                        disabled={isGenerating}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate Label Now
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show input form only when no data exists or user chooses to edit */}
                    {currentTemplate.includes.nutrition && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Serving Size</Label>
                          <Input
                            value={nutritionForm.serving_size}
                            onChange={(e) => setNutritionForm(prev => ({ ...prev, serving_size: e.target.value }))}
                            placeholder="1 cup"
                          />
                        </div>
                        <div>
                          <Label>Calories</Label>
                          <Input
                            type="number"
                            value={nutritionForm.calories}
                            onChange={(e) => setNutritionForm(prev => ({ ...prev, calories: e.target.value }))}
                            placeholder="250"
                          />
                        </div>
                        <div>
                          <Label>Total Fat (g)</Label>
                          <Input
                            type="number"
                            value={nutritionForm.total_fat}
                            onChange={(e) => setNutritionForm(prev => ({ ...prev, total_fat: e.target.value }))}
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <Label>Sodium (mg)</Label>
                          <Input
                            type="number"
                            value={nutritionForm.sodium}
                            onChange={(e) => setNutritionForm(prev => ({ ...prev, sodium: e.target.value }))}
                            placeholder="300"
                          />
                        </div>
                        <div>
                          <Label>Total Carbs (g)</Label>
                          <Input
                            type="number"
                            value={nutritionForm.total_carbohydrates}
                            onChange={(e) => setNutritionForm(prev => ({ ...prev, total_carbohydrates: e.target.value }))}
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <Label>Protein (g)</Label>
                          <Input
                            type="number"
                            value={nutritionForm.protein}
                            onChange={(e) => setNutritionForm(prev => ({ ...prev, protein: e.target.value }))}
                            placeholder="8"
                          />
                        </div>
                      </div>
                    )}

                    {currentTemplate.includes.ingredients && (
                      <div>
                        <Label>Ingredients</Label>
                        <Textarea
                          value={nutritionForm.ingredients}
                          onChange={(e) => setNutritionForm(prev => ({ ...prev, ingredients: e.target.value }))}
                          placeholder="Water, wheat flour, salt..."
                          rows={3}
                        />
                      </div>
                    )}

                    {currentTemplate.includes.allergens && (
                      <div>
                        <Label>Allergens (comma-separated)</Label>
                        <Input
                          value={nutritionForm.allergens.join(', ')}
                          onChange={(e) => setNutritionForm(prev => ({ 
                            ...prev, 
                            allergens: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                          }))}
                          placeholder="Milk, Eggs, Wheat"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button onClick={saveNutritionalInfo} className="flex-1">
                        Save Nutritional Info
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={generateLabel} 
                        disabled={isGenerating}
                        className="flex-1"
                      >
                        Skip & Generate Label
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Label Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <FoodLabelPreview 
                  selectedItems={[selectedItem]}
                  selectedItemId={selectedItem.id}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Select a product to see preview
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};