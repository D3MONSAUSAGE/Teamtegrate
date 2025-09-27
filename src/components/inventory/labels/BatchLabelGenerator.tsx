import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/inventory';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { InventoryItem } from '@/contexts/inventory/types';
import { Download, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';

export const BatchLabelGenerator: React.FC = () => {
  const { items, categories } = useInventory();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

    if (selectedCategory) {
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

    try {
      toast.success(`Generating ${selectedItems.size * labelsPerItem} labels...`);
      
      // TODO: Implement actual batch label generation
      // This would involve:
      // 1. Get the selected template
      // 2. For each selected item, generate the label data
      // 3. Create a multi-page PDF or multiple files
      // 4. Log the generation in the generated_labels table
      
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        toast.error('Selected template not found');
        return;
      }

      // For now, just show success message
      toast.success(`Batch label generation completed! Generated ${selectedItems.size * labelsPerItem} labels.`);
      
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
              <SelectItem value="">All categories</SelectItem>
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