import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { useAuth } from '@/contexts/AuthContext';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { generatedLabelsApi } from '@/contexts/inventory/api/generatedLabels';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { inventoryLotsApi, InventoryLot } from '@/contexts/inventory/api/inventoryLots';
import { InventoryItem } from '@/contexts/inventory/types';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { FoodLabelPreview } from './FoodLabelPreview';
import { Download, Printer, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const BatchLabelGenerator: React.FC = () => {
  const { items, categories } = useEnhancedInventoryManagement();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [labelsPerItem, setLabelsPerItem] = useState(1);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [nutritionalData, setNutritionalData] = useState<Record<string, NutritionalInfo>>({});
  const [lotData, setLotData] = useState<Record<string, InventoryLot[]>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadNutritionalData();
    loadLotData();
  }, []);

  useEffect(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const data = await labelTemplatesApi.getAll();
      setTemplates(data);
      
      // Auto-select food product template if available
      const foodTemplate = data.find(t => t.category === 'food_product');
      if (foodTemplate) {
        setSelectedTemplate(foodTemplate.id);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load label templates');
    }
  };

  const loadNutritionalData = async () => {
    const nutritionalMap: Record<string, NutritionalInfo> = {};
    for (const item of items) {
      try {
        const data = await nutritionalInfoApi.getByItemId(item.id);
        if (data) nutritionalMap[item.id] = data;
      } catch (error) {
        console.warn(`No nutritional data for item ${item.id}`);
      }
    }
    setNutritionalData(nutritionalMap);
  };

  const loadLotData = async () => {
    const lotMap: Record<string, InventoryLot[]> = {};
    for (const item of items) {
      try {
        const lots = await inventoryLotsApi.getByItemId(item.id);
        if (lots.length > 0) lotMap[item.id] = lots;
      } catch (error) {
        console.warn(`No lot data for item ${item.id}`);
      }
    }
    setLotData(lotMap);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const createFoodLabelContent = (item: any) => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template || template.category !== 'food_product') {
      return createBasicLabelContent(item);
    }

    const nutritional = nutritionalData[item.id];
    const lots = lotData[item.id];
    const currentLot = lots?.[0]; // Use most recent lot

    const content = [];

    // Map each field in the template
    const fields = template.template_data?.fields || [];
    
    fields.forEach((field: any) => {
      let value = '';
      
      switch (field.field) {
        case 'name':
          value = item.name || '';
          break;
        case 'sku':
          value = item.sku || '';
          break;
        case 'product_url':
          value = `https://app.com/product/${item.id}`;
          break;
        case 'lot_info':
          value = JSON.stringify({
            lotNumber: currentLot?.lot_number || BarcodeGenerator.generateLotNumber(),
            expirationDate: currentLot?.expiration_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          });
          break;
        case 'nutritional_info':
          if (nutritional) {
            value = JSON.stringify({
              servingSize: nutritional.serving_size,
              calories: nutritional.calories,
              totalFat: nutritional.total_fat,
              sodium: nutritional.sodium,
              totalCarbs: nutritional.total_carbohydrates,
              protein: nutritional.protein
            });
          }
          break;
        case 'ingredients':
          value = nutritional?.ingredients || 'See product packaging for ingredients';
          break;
        case 'allergens':
          value = nutritional?.allergens?.join(', ') || 'Check product packaging';
          break;
        default:
          value = (item as any)[field.field] || '';
      }

      if (value) {
        content.push({
          type: field.type,
          value: value,
          x: field.x,
          y: field.y,
          options: {
            fontSize: field.fontSize,
            fontWeight: field.fontWeight,
            width: field.width,
            height: field.height,
            size: field.size,
            format: field.format,
            align: field.align,
            lineHeight: field.lineHeight,
            wordWrap: field.wordWrap,
            highlightAllergens: field.highlightAllergens
          }
        });
      }
    });

    return content;
  };

  const createBasicLabelContent = (item: any) => {
    return [
      {
        type: 'text',
        value: item.name || 'Unnamed Item',
        x: 20,
        y: 30,
        options: { fontSize: 14, fontWeight: 'bold' }
      },
      {
        type: 'text', 
        value: `SKU: ${item.sku || 'No SKU'}`,
        x: 20,
        y: 50,
        options: { fontSize: 10 }
      },
      {
        type: 'barcode',
        value: item.sku || BarcodeGenerator.generateRandomSKU(),
        x: 20,
        y: 70,
        options: { width: 100, height: 30 }
      }
    ];
  };

  const handleGenerateBatch = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a label template');
      return;
    }

    if (!user || !user.organizationId) {
      toast.error('Authentication error - please log in again');
      return;
    }

    try {
      setGenerating(true);
      console.log('BatchLabelGenerator: Starting batch generation for', selectedItems.size, 'items');

      const selectedInventoryItems = items.filter(item => selectedItems.has(item.id));
      const template = templates.find(t => t.id === selectedTemplate);
      const dimensions = template ? template.dimensions as any : BarcodeGenerator.getThermalDimensions('4x6');

      // Create PDF content for all selected items
      const allContent: any[] = [];
      
      for (const item of selectedInventoryItems) {
        for (let labelIndex = 0; labelIndex < labelsPerItem; labelIndex++) {
          const content = template?.category === 'food_product' 
            ? createFoodLabelContent(item)
            : createBasicLabelContent(item);
          
          allContent.push(...content);
        }

        // Log each label generation to database
        try {
          await generatedLabelsApi.create({
            organization_id: user.organizationId,
            template_id: selectedTemplate,
            item_id: item.id,
            label_data: { 
              item_name: item.name,
              item_sku: item.sku,
              labels_generated: labelsPerItem
            },
            print_format: 'PDF',
            quantity_printed: labelsPerItem,
            printed_by: user.id
          });
        } catch (error) {
          console.warn('Failed to log label generation:', error);
        }
      }

      // Generate multi-page PDF
      const pdf = BarcodeGenerator.createLabelPDF(allContent, dimensions);
      
      // Download the PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `batch-labels-${timestamp}.pdf`;
      pdf.save(filename);

      toast.success(`Generated ${selectedItems.size * labelsPerItem} labels successfully`);
      console.log('BatchLabelGenerator: PDF generation completed');
    } catch (error) {
      console.error('BatchLabelGenerator: Error generating batch:', error);
      toast.error('Failed to generate batch labels');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to preview');
      return;
    }

    const firstSelectedItem = items.find(item => selectedItems.has(item.id));
    if (firstSelectedItem) {
      const nutritional = nutritionalData[firstSelectedItem.id];
      const lots = lotData[firstSelectedItem.id];
      
      setPreviewData({
        name: firstSelectedItem.name,
        sku: firstSelectedItem.sku,
        lot_number: lots?.[0]?.lot_number,
        expiration_date: lots?.[0]?.expiration_date,
        ingredients: nutritional?.ingredients,
        allergens: nutritional?.allergens?.join(', '),
        nutritional_info: nutritional ? {
          servingSize: nutritional.serving_size,
          calories: nutritional.calories,
          totalFat: nutritional.total_fat,
          sodium: nutritional.sodium,
          totalCarbs: nutritional.total_carbohydrates,
          protein: nutritional.protein
        } : undefined
      });
    }
  };

  const isAllSelected = selectedItems.size === filteredItems.length && filteredItems.length > 0;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="batch">Batch Generation</TabsTrigger>
          <TabsTrigger value="preview">Label Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch-template">Label Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="labels-per-item">Labels per Item</Label>
              <Input
                id="labels-per-item"
                type="number"
                min="1"
                max="20"
                value={labelsPerItem}
                onChange={(e) => setLabelsPerItem(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-filter">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-search">Search Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="item-search"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Select Items ({selectedItems.size} selected)
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) {
                        const input = el.querySelector('input') as HTMLInputElement;
                        if (input) input.indeterminate = isIndeterminate;
                      }
                    }}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.sku || 'N/A'} • Stock: {item.current_stock}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category.name}
                        </Badge>
                      )}
                      {nutritionalData[item.id] && (
                        <Badge variant="outline" className="text-xs bg-emerald-50">
                          Nutrition Data
                        </Badge>
                      )}
                      {lotData[item.id] && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          Lot Tracked
                        </Badge>
                      )}
                      {item.current_stock < (item.minimum_threshold || 0) && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || selectedCategory ? 'No items match your filters' : 'No items available'}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedItems.size} items selected • {selectedItems.size * labelsPerItem} labels will be generated
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={selectedItems.size === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleGenerateBatch}
                disabled={selectedItems.size === 0 || !selectedTemplate || generating}
              >
                <Printer className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Labels'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Food Label Preview</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Preview shows how your food labels will appear with comprehensive nutrition information
            </p>
            <FoodLabelPreview 
              selectedItems={filteredItems.filter(item => selectedItems.has(item.id))}
              selectedItemId={filteredItems.find(item => selectedItems.has(item.id))?.id}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};