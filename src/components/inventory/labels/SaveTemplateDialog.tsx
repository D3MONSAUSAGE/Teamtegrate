import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { LabelContentConfig } from './LabelContentSelector';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentConfig: LabelContentConfig;
  selectedItems?: any[];
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  open,
  onOpenChange,
  contentConfig,
  selectedItems = []
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('product');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!user?.organizationId) {
      toast.error('User authentication error');
      return;
    }

    try {
      setSaving(true);

      // Generate field definitions from content config
      const fields: any[] = [];
      
      if (contentConfig.name) {
        fields.push({
          type: 'text',
          field: 'name',
          x: 10,
          y: 10,
          fontSize: 14,
          fontWeight: 'bold'
        });
      }

      if (contentConfig.sku) {
        fields.push({
          type: 'text',
          field: 'sku',
          x: 10,
          y: 30,
          fontSize: 10
        });
      }

      if (contentConfig.barcode) {
        fields.push({
          type: 'barcode',
          field: 'sku',
          x: 10,
          y: 50,
          format: 'CODE128',
          width: 150,
          height: 30
        });
      }

      if (contentConfig.qrCode) {
        fields.push({
          type: 'qr',
          field: 'item_data',
          x: 170,
          y: 50,
          size: 40
        });
      }

      if (contentConfig.lotNumber) {
        fields.push({
          type: 'text',
          field: 'lot_number',
          x: 10,
          y: 90,
          fontSize: 9,
          fontWeight: 'bold'
        });
      }

      if (contentConfig.expirationDate) {
        fields.push({
          type: 'text',
          field: 'expiration_date',
          x: 120,
          y: 90,
          fontSize: 9
        });
      }

      if (contentConfig.ingredients) {
        fields.push({
          type: 'text',
          field: 'ingredients',
          x: 10,
          y: 110,
          fontSize: 8,
          wordWrap: true,
          width: 200
        });
      }

      if (contentConfig.allergens) {
        fields.push({
          type: 'text',
          field: 'allergens',
          x: 10,
          y: 130,
          fontSize: 8,
          fontWeight: 'bold',
          highlightAllergens: true
        });
      }

      if (contentConfig.nutritionalFacts) {
        fields.push({
          type: 'nutritional',
          field: 'nutritional_info',
          x: 10,
          y: 150,
          fontSize: 7,
          width: 200,
          height: 80
        });
      }

      const templateData = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        organization_id: user.organizationId,
        created_by: user.id,
        is_active: true,
        is_default: false,
        dimensions: { width: 4, height: 6, unit: 'inches' },
        printer_type: 'thermal',
        template_data: {
          created_from_generator: true,
          content_config: contentConfig,
          fields,
          source_items: selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            sku: item.sku
          }))
        }
      };

      await labelTemplatesApi.create(templateData as any);
      
      toast.success('Template saved successfully');
      onOpenChange(false);
      setName('');
      setDescription('');
      setCategory('product');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Label Template</DialogTitle>
          <DialogDescription>
            Save this label configuration as a template for future use and reprinting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Food Product Label, Standard Product Label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description (Optional)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="food_product">Food Product</SelectItem>
                <SelectItem value="lot">Lot Tracking</SelectItem>
                <SelectItem value="nutritional">Nutritional</SelectItem>
                <SelectItem value="qr">QR Code</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};