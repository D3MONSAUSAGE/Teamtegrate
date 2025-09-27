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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { labelTemplatesApi, LabelTemplate } from '@/contexts/inventory/api/labelTemplates';
import { LabelContentConfig } from './LabelContentSelector';
import { Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentConfig: LabelContentConfig;
  templateData: any;
  dimensions: { width: number; height: number; unit: string };
  onTemplateSaved?: (template: LabelTemplate) => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  open,
  onOpenChange,
  contentConfig,
  templateData,
  dimensions,
  onTemplateSaved
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'product' as const,
    printer_type: 'thermal' as const
  });

  const getSelectedFields = () => {
    return Object.entries(contentConfig)
      .filter(([key, value]) => typeof value === 'boolean' && value)
      .map(([key]) => key);
  };

  const handleSaveTemplate = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);

    try {
      // Create template with content configuration
      const templatePayload = {
        organization_id: user.organizationId,
        created_by: user.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        printer_type: formData.printer_type,
        is_default: false,
        is_active: true,
        dimensions,
        template_data: {
          ...templateData,
          content_config: contentConfig,
          selected_fields: getSelectedFields(),
          created_from_generator: true,
          created_at: new Date().toISOString()
        }
      };

      const savedTemplate = await labelTemplatesApi.create(templatePayload as any);
      
      toast.success(`Template "${formData.name}" saved successfully`);
      
      if (onTemplateSaved) {
        onTemplateSaved(savedTemplate);
      }
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'product',
        printer_type: 'thermal'
      });
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryFromFields = () => {
    const fields = getSelectedFields();
    
    if (fields.includes('nutritionalFacts') || fields.includes('ingredients')) {
      return 'food_product';
    }
    
    if (fields.includes('lotNumber') || fields.includes('expirationDate')) {
      return 'lot';
    }
    
    if (fields.includes('qrCode') && fields.length <= 3) {
      return 'qr';
    }
    
    return 'product';
  };

  // Auto-suggest category based on selected fields
  React.useEffect(() => {
    if (formData.category === 'product') {
      const suggestedCategory = getCategoryFromFields();
      if (suggestedCategory !== 'product') {
        setFormData(prev => ({ ...prev, category: suggestedCategory as any }));
      }
    }
  }, [contentConfig]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save this label configuration as a reusable template for future use
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Food Product Label"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of when to use this template"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="lot">Lot Tracking</SelectItem>
                    <SelectItem value="food_product">Food Product</SelectItem>
                    <SelectItem value="nutritional">Nutritional</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-printer">Printer Type</Label>
                <Select
                  value={formData.printer_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, printer_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermal</SelectItem>
                    <SelectItem value="universal">Universal</SelectItem>
                    <SelectItem value="zebra">Zebra</SelectItem>
                    <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="dymo">DYMO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dimensions</Label>
              <div className="text-sm text-muted-foreground">
                {dimensions.width}" × {dimensions.height}" ({dimensions.unit})
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Selected Fields ({getSelectedFields().length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedFields().map((field) => (
                    <Badge key={field} variant="secondary" className="text-xs">
                      {field.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}
                    </Badge>
                  ))}
                </div>
                {getSelectedFields().length === 0 && (
                  <p className="text-sm text-muted-foreground">No fields selected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Template Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Consistent labeling across your inventory</li>
                  <li>• Quick reprinting with lot number updates</li>
                  <li>• Reuse configuration for similar products</li>
                  <li>• Team-wide access to standardized templates</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={saving || !formData.name.trim()}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};