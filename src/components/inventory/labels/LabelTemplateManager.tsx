import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { Plus, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const LabelTemplateManager: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'product' as 'product' | 'food_product' | 'lot' | 'nutritional' | 'qr' | 'custom',
    dimensions: { width: 2, height: 1, unit: 'inches' as const },
    printer_type: 'universal' as const
  });

  useEffect(() => {
    console.log('LabelTemplateManager: Loading templates...');
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('LabelTemplateManager: Starting template load...');
      setLoading(true);
      const data = await labelTemplatesApi.getAll();
      console.log('LabelTemplateManager: Templates loaded:', data?.length || 0);
      setTemplates(data);
    } catch (error) {
      console.error('LabelTemplateManager: Error loading templates:', error);
      toast.error('Failed to load label templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'product',
      dimensions: { width: 2, height: 1, unit: 'inches' },
      printer_type: 'universal'
    });
    setEditDialogOpen(true);
  };

  const handleCreateFoodTemplate = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await labelTemplatesApi.createDefaultFoodTemplate(user.organizationId, user.id);
      toast.success('Food label template created successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error creating food template:', error);
      toast.error('Failed to create food template');
    }
  };

  const handleEditTemplate = (template: LabelTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category as any,
      dimensions: template.dimensions as any,
      printer_type: template.printer_type as any
    });
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Template name is required');
        return;
      }

      const templateData = {
        ...formData,
        organization_id: '', // Will be set by the API
        created_by: '', // Will be set by the API
        is_active: true,
        is_default: false,
        template_data: {
          created_from_generator: false,
          content_config: {
            name: true,
            sku: true,
            barcode: true,
            qrCode: false,
            lotNumber: formData.category === 'food_product',
            expirationDate: formData.category === 'food_product',
            ingredients: formData.category === 'food_product',
            allergens: formData.category === 'food_product',
            nutritionalFacts: formData.category === 'food_product'
          },
          fields: [
            {
              type: 'text',
              field: 'name',
              x: 10,
              y: 10,
              fontSize: 14,
              fontWeight: 'bold'
            },
            {
              type: 'text',
              field: 'sku',
              x: 10,
              y: 30,
              fontSize: 10
            },
            {
              type: 'barcode',
              field: 'sku',
              x: 10,
              y: 50,
              format: 'CODE128',
              width: 150,
              height: 30
            }
          ]
        }
      };

      if (selectedTemplate) {
        await labelTemplatesApi.update(selectedTemplate.id, templateData);
        toast.success('Template updated successfully');
      } else {
        await labelTemplatesApi.create(templateData as any);
        toast.success('Template created successfully');
      }

      setEditDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (template: LabelTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await labelTemplatesApi.delete(template.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: LabelTemplate) => {
    try {
      const duplicateData = {
        ...template,
        name: `${template.name} (Copy)`,
        is_default: false
      };
      delete (duplicateData as any).id;
      delete (duplicateData as any).created_at;
      delete (duplicateData as any).updated_at;

      await labelTemplatesApi.create(duplicateData as any);
      toast.success('Template duplicated successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product': return 'bg-blue-100 text-blue-800';
      case 'lot': return 'bg-green-100 text-green-800';
      case 'nutritional': return 'bg-orange-100 text-orange-800';
      case 'food_product': return 'bg-emerald-100 text-emerald-800';
      case 'qr': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrinterTypeColor = (type: string) => {
    switch (type) {
      case 'thermal': return 'bg-cyan-100 text-cyan-800';
      case 'zebra': return 'bg-yellow-100 text-yellow-800';
      case 'brother': return 'bg-red-100 text-red-800';
      case 'dymo': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Label Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your label templates for different inventory scenarios
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
        <Button 
          variant="outline" 
          onClick={handleCreateFoodTemplate}
          className="ml-2"
        >
          Create Food Label
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
                <Badge className={getPrinterTypeColor(template.printer_type)}>
                  {template.printer_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground mb-3">
                {(template.dimensions as any)?.width || 2}" × {(template.dimensions as any)?.height || 1}"
              </div>
              <div className="flex justify-between">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No label templates found</p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Update template details' : 'Create a new label template'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
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
                    <SelectItem value="nutritional">Nutritional</SelectItem>
                    <SelectItem value="food_product">Food Product</SelectItem>
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
                    <SelectItem value="universal">Universal</SelectItem>
                    <SelectItem value="thermal">Thermal</SelectItem>
                    <SelectItem value="zebra">Zebra</SelectItem>
                    <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="dymo">DYMO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-width">Width (inches)</Label>
                <Input
                  id="template-width"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="8.5"
                  value={formData.dimensions.width}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, width: Number(e.target.value) }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-height">Height (inches)</Label>
                <Input
                  id="template-height"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="11"
                  value={formData.dimensions.height}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, height: Number(e.target.value) }
                  }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                {selectedTemplate ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};