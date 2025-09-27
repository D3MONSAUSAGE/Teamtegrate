import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { generatedLabelsApi } from '@/contexts/inventory/api/generatedLabels';
import { InventoryItem } from '@/contexts/inventory/types';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { Download, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';

export const BatchLabelGenerator: React.FC = () => {
  const { items, categories } = useInventory();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [labelsPerItem, setLabelsPerItem] = useState(1);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadTemplates();
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
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load label templates');
    }
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
      toast.success(`Generating ${selectedItems.size * labelsPerItem} labels...`);
      
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        toast.error('Selected template not found');
        return;
      }

      const selectedItemsData = items.filter(item => selectedItems.has(item.id));
      const allLabelContent: any[] = [];
      let totalLabelsGenerated = 0;

      // Generate label content for each selected item
      for (const item of selectedItemsData) {
        for (let labelIndex = 0; labelIndex < labelsPerItem; labelIndex++) {
          const labelContent = template.template_data.fields.map((field: any) => {
            let value = '';
            
            switch (field.field) {
              case 'name':
                value = item.name;
                break;
              case 'sku':
                value = item.sku || '';
                break;
              case 'barcode':
                value = item.barcode || item.sku || item.id;
                break;
              case 'lot_number':
                value = (item as any).lot_number || BarcodeGenerator.generateLotNumber();
                break;
              case 'expiration_date':
                value = (item as any).expiration_date ? new Date((item as any).expiration_date).toLocaleDateString() : '';
                break;
              case 'serving_size':
                value = (item as any).serving_size || '';
                break;
              case 'calories':
                value = (item as any).calories?.toString() || '';
                break;
              default:
                value = '';
            }

            // Add prefix if specified
            if (field.prefix && value) {
              value = field.prefix + value;
            }

            return {
              type: field.type,
              value,
              x: field.x,
              y: field.y,
              options: {
                fontSize: field.fontSize,
                fontWeight: field.fontWeight,
                width: field.width,
                height: field.height,
                format: field.format,
                size: field.size
              }
            };
          });

          allLabelContent.push(labelContent);
          totalLabelsGenerated++;
        }

        // Log each item's label generation to database
        await generatedLabelsApi.create({
          organization_id: user.organizationId,
          template_id: template.id,
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
      }

      // Create multi-page PDF
      const pdf = BarcodeGenerator.createLabelPDF(
        allLabelContent[0], // Use first label as base
        template.dimensions
      );

      // Add additional pages for remaining labels
      for (let i = 1; i < allLabelContent.length; i++) {
        pdf.addPage();
        const content = allLabelContent[i];
        
        content.forEach((item: any) => {
          switch (item.type) {
            case 'text':
              pdf.setFontSize(item.options?.fontSize || 12);
              pdf.text(item.value, item.x, item.y);
              break;
              
            case 'barcode':
              const barcodeImg = BarcodeGenerator.generateBarcode(item.value, item.options);
              if (barcodeImg) {
                pdf.addImage(barcodeImg, 'PNG', item.x, item.y, item.options?.width || 100, item.options?.height || 30);
              }
              break;
              
            case 'qr':
              BarcodeGenerator.generateQRCode(item.value, item.options).then(qrImg => {
                if (qrImg) {
                  pdf.addImage(qrImg, 'PNG', item.x, item.y, item.options?.size || 40, item.options?.size || 40);
                }
              });
              break;
          }
        });
      }

      // Download the PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `batch-labels-${timestamp}.pdf`;
      pdf.save(filename);

      toast.success(`Batch label generation completed! Generated ${totalLabelsGenerated} labels.`);
      
    } catch (error) {
      console.error('Error generating batch labels:', error);
      toast.error('Failed to generate batch labels');
    }
  };

  const isAllSelected = selectedItems.size === filteredItems.length && filteredItems.length > 0;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

  return (
    <div className="space-y-6">
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
            onClick={handleGenerateBatch}
            disabled={selectedItems.size === 0 || !selectedTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
          <Button
            onClick={handleGenerateBatch}
            disabled={selectedItems.size === 0 || !selectedTemplate}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
        </div>
      </div>
    </div>
  );
};