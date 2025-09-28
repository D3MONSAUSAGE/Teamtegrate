import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { InventoryItem } from '@/contexts/inventory/types';
import { NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { Package, FileText, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface LabelData {
  includeNutrition: boolean;
  includeIngredients: boolean;
  includeAllergens: boolean;
  includeBarcode: boolean;
  includeBasicInfo: boolean;
}

export const SimpleLabelGenerator: React.FC = () => {
  const { items } = useEnhancedInventoryManagement();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [labelData, setLabelData] = useState<LabelData>({
    includeNutrition: true,
    includeIngredients: true,
    includeAllergens: true,
    includeBarcode: true,
    includeBasicInfo: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Get selected item data
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
      setNutritionalInfo(null);
    }
  }, [selectedItemId, items]);

  // Fetch nutritional info when item is selected
  useEffect(() => {
    if (selectedItem) {
      nutritionalInfoApi.getByItemId(selectedItem.id).then(setNutritionalInfo);
    }
  }, [selectedItem]);

  const handleDataToggle = (key: keyof LabelData, checked: boolean) => {
    setLabelData(prev => ({ ...prev, [key]: checked }));
  };

  const generateBarcode = async (item: InventoryItem): Promise<string> => {
    let barcode = item.barcode;
    
    if (!barcode) {
      // Auto-generate barcode using SKU or random
      barcode = item.sku || BarcodeGenerator.generateRandomSKU();
      
      try {
        await inventoryItemsApi.update(item.id, { barcode });
        toast.success(`Auto-generated barcode: ${barcode}`);
      } catch (error) {
        toast.error('Failed to save auto-generated barcode');
        console.error(error);
      }
    }
    
    return BarcodeGenerator.generateBarcode(barcode, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      background: '#ffffff',
      lineColor: '#000000'
    });
  };

  const generateFoodLabel = async () => {
    if (!selectedItem) {
      toast.error('Please select an item first');
      return;
    }

    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      
      // Title
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('FOOD PRODUCT LABEL', 20, yPosition);
      yPosition += 15;
      
      // Basic Product Info
      if (labelData.includeBasicInfo) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(selectedItem.name, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        if (selectedItem.description) {
          pdf.text(selectedItem.description, 20, yPosition);
          yPosition += 6;
        }
        
        pdf.text(`SKU: ${selectedItem.sku || 'N/A'}`, 20, yPosition);
        yPosition += 10;
      }
      
      // Barcode
      if (labelData.includeBarcode) {
        try {
          const barcodeImage = await generateBarcode(selectedItem);
          if (barcodeImage) {
            pdf.addImage(barcodeImage, 'PNG', 20, yPosition, 80, 20);
            yPosition += 25;
          }
        } catch (error) {
          console.error('Failed to generate barcode:', error);
        }
      }
      
      // Ingredients
      if (labelData.includeIngredients && nutritionalInfo?.ingredients) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('INGREDIENTS:', 20, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const ingredients = pdf.splitTextToSize(nutritionalInfo.ingredients, 170);
        pdf.text(ingredients, 20, yPosition);
        yPosition += ingredients.length * 4 + 5;
      }
      
      // Allergens
      if (labelData.includeAllergens && nutritionalInfo?.allergens?.length) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('ALLERGENS:', 20, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Contains: ${nutritionalInfo.allergens.join(', ')}`, 20, yPosition);
        yPosition += 10;
      }
      
      // Nutrition Facts
      if (labelData.includeNutrition && nutritionalInfo) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Nutrition Facts', 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        if (nutritionalInfo.serving_size) {
          pdf.text(`Serving Size: ${nutritionalInfo.serving_size}`, 20, yPosition);
          yPosition += 5;
        }
        
        if (nutritionalInfo.servings_per_container) {
          pdf.text(`Servings Per Container: ${nutritionalInfo.servings_per_container}`, 20, yPosition);
          yPosition += 5;
        }
        
        // Draw nutrition facts box
        pdf.rect(20, yPosition, 170, 80);
        yPosition += 8;
        
        const nutritionItems = [
          { label: 'Calories', value: nutritionalInfo.calories },
          { label: 'Total Fat', value: nutritionalInfo.total_fat, unit: 'g' },
          { label: 'Saturated Fat', value: nutritionalInfo.saturated_fat, unit: 'g' },
          { label: 'Trans Fat', value: nutritionalInfo.trans_fat, unit: 'g' },
          { label: 'Cholesterol', value: nutritionalInfo.cholesterol, unit: 'mg' },
          { label: 'Sodium', value: nutritionalInfo.sodium, unit: 'mg' },
          { label: 'Total Carbohydrates', value: nutritionalInfo.total_carbohydrates, unit: 'g' },
          { label: 'Dietary Fiber', value: nutritionalInfo.dietary_fiber, unit: 'g' },
          { label: 'Total Sugars', value: nutritionalInfo.total_sugars, unit: 'g' },
          { label: 'Added Sugars', value: nutritionalInfo.added_sugars, unit: 'g' },
          { label: 'Protein', value: nutritionalInfo.protein, unit: 'g' },
        ];
        
        nutritionItems.forEach(item => {
          if (item.value !== null && item.value !== undefined) {
            const text = `${item.label}: ${item.value}${item.unit || ''}`;
            pdf.text(text, 25, yPosition);
            yPosition += 5;
          }
        });
      }
      
      // Footer
      yPosition = Math.max(yPosition + 10, 250);
      pdf.setFontSize(8);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      
      // Save PDF
      const filename = `food-label-${selectedItem.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      pdf.save(filename);
      
      toast.success('Food label generated successfully!');
      
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate food label');
    } finally {
      setIsGenerating(false);
    }
  };

  const getAvailableDataCount = () => {
    let count = 1; // Basic info always available
    if (nutritionalInfo?.ingredients) count++;
    if (nutritionalInfo?.allergens?.length) count++;
    if (nutritionalInfo && (nutritionalInfo.calories || nutritionalInfo.total_fat)) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Simple Food Label Generator</h2>
        <p className="text-muted-foreground mt-2">
          Select an item, choose what to include, and generate a professional FDA-compliant food label
        </p>
      </div>

      {/* Item Selection */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Step 1: Select Product
          </CardTitle>
          <CardDescription>Choose which inventory item you want to create a label for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an inventory item..." />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground ml-2">SKU: {item.sku || 'N/A'}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data Selection */}
      {selectedItem && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Step 2: Choose What to Include
            </CardTitle>
            <CardDescription>
              Select which data to include in your food label ({getAvailableDataCount()} data types available)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={labelData.includeBasicInfo}
                  onCheckedChange={(checked) => handleDataToggle('includeBasicInfo', checked as boolean)}
                />
                <div>
                  <Label className="font-medium">Basic Product Information</Label>
                  <p className="text-sm text-muted-foreground">Name, description, SKU</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Available
              </Badge>
            </div>

            {/* Barcode */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={labelData.includeBarcode}
                  onCheckedChange={(checked) => handleDataToggle('includeBarcode', checked as boolean)}
                />
                <div>
                  <Label className="font-medium">Barcode</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.barcode ? `Current: ${selectedItem.barcode}` : 'Will auto-generate if missing'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={selectedItem.barcode ? "bg-green-50" : "bg-yellow-50"}>
                {selectedItem.barcode ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Has Barcode
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Will Generate
                  </>
                )}
              </Badge>
            </div>

            {/* Nutritional Info */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={labelData.includeNutrition}
                  onCheckedChange={(checked) => handleDataToggle('includeNutrition', checked as boolean)}
                  disabled={!nutritionalInfo || (!nutritionalInfo.calories && !nutritionalInfo.total_fat)}
                />
                <div>
                  <Label className={`font-medium ${!nutritionalInfo || (!nutritionalInfo.calories && !nutritionalInfo.total_fat) ? 'text-muted-foreground' : ''}`}>
                    Nutrition Facts
                  </Label>
                  <p className="text-sm text-muted-foreground">FDA-compliant nutrition facts panel</p>
                </div>
              </div>
              <Badge variant="outline" className={nutritionalInfo && (nutritionalInfo.calories || nutritionalInfo.total_fat) ? "bg-green-50" : "bg-red-50"}>
                {nutritionalInfo && (nutritionalInfo.calories || nutritionalInfo.total_fat) ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Not Available
                  </>
                )}
              </Badge>
            </div>

            {/* Ingredients */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={labelData.includeIngredients}
                  onCheckedChange={(checked) => handleDataToggle('includeIngredients', checked as boolean)}
                  disabled={!nutritionalInfo?.ingredients}
                />
                <div>
                  <Label className={`font-medium ${!nutritionalInfo?.ingredients ? 'text-muted-foreground' : ''}`}>
                    Ingredients List
                  </Label>
                  <p className="text-sm text-muted-foreground">Complete ingredients list</p>
                </div>
              </div>
              <Badge variant="outline" className={nutritionalInfo?.ingredients ? "bg-green-50" : "bg-red-50"}>
                {nutritionalInfo?.ingredients ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Not Available
                  </>
                )}
              </Badge>
            </div>

            {/* Allergens */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={labelData.includeAllergens}
                  onCheckedChange={(checked) => handleDataToggle('includeAllergens', checked as boolean)}
                  disabled={!nutritionalInfo?.allergens?.length}
                />
                <div>
                  <Label className={`font-medium ${!nutritionalInfo?.allergens?.length ? 'text-muted-foreground' : ''}`}>
                    Allergen Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {nutritionalInfo?.allergens?.length 
                      ? `Contains: ${nutritionalInfo.allergens.join(', ')}`
                      : 'No allergens listed'
                    }
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={nutritionalInfo?.allergens?.length ? "bg-green-50" : "bg-red-50"}>
                {nutritionalInfo?.allergens?.length ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available ({nutritionalInfo.allergens.length})
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Not Available
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {selectedItem && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Ready to Generate!</h3>
                <p className="text-muted-foreground">
                  Your comprehensive food label will include all selected data in FDA-compliant format
                </p>
              </div>
              <Button 
                onClick={generateFoodLabel}
                disabled={isGenerating}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating Label...' : 'Generate Food Label PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};