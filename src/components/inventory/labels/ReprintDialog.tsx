import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { InventoryItem } from '@/contexts/inventory/types';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { RotateCcw, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ReprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
}

export const ReprintDialog: React.FC<ReprintDialogProps> = ({
  open,
  onOpenChange,
  item
}) => {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);
  const [lotNumber, setLotNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [printerType, setPrinterType] = useState<'universal' | 'zebra' | 'brother' | 'dymo'>('universal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSavedTemplates();
    }
  }, [open]);

  const loadSavedTemplates = async () => {
    try {
      setLoading(true);
      const data = await labelTemplatesApi.getAll();
      
      // Filter templates that were created from the generator or have content_config
      const reprintableTemplates = data.filter(template => {
        const templateData = template.template_data as any;
        return templateData?.created_from_generator || templateData?.content_config;
      });
      
      setTemplates(reprintableTemplates);
      
      // Auto-select if only one template or find best match for item
      if (reprintableTemplates.length === 1) {
        setSelectedTemplate(reprintableTemplates[0]);
      } else if (item && reprintableTemplates.length > 0) {
        // Try to find template that matches item context
        const contextMatch = reprintableTemplates.find(t => 
          t.category === 'food_product' || t.category === 'product'
        );
        if (contextMatch) {
          setSelectedTemplate(contextMatch);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const generateLabelData = () => {
    if (!selectedTemplate || !item) return {};

    const today = new Date().toISOString().split('T')[0];
    const defaultExpiration = new Date();
    defaultExpiration.setMonth(defaultExpiration.getMonth() + 6);
    
    return {
      name: item.name,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || '',
      category: item.category?.name || '',
      vendor: item.vendor?.name || '',
      location: item.location || '',
      current_stock: item.current_stock,
      unit: item.base_unit?.name || '',
      lot_number: lotNumber || `LOT-${Date.now().toString().slice(-6)}`,
      manufacturing_date: today,
      expiration_date: expirationDate || defaultExpiration.toISOString().split('T')[0],
      quantity_received: quantity,
      quantity_remaining: quantity,
      item_data: JSON.stringify({
        id: item.id,
        name: item.name,
        sku: item.sku,
        lot: lotNumber
      })
    };
  };

  const handleReprint = () => {
    if (!selectedTemplate || !item) {
      toast.error('Please select a template');
      return;
    }

    if (printerType === 'universal') {
      handleDownloadPDF();
    } else {
      toast.info(`${printerType} printer support is coming soon!`);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedTemplate || !item) return;

    try {
      const labelData = generateLabelData();
      const template = selectedTemplate.template_data as any;
      const dimensions = selectedTemplate.dimensions as any;

      // Use content_config if available, otherwise fall back to template fields
      const contentConfig = template.content_config;
      let fields = template.fields || [];

      if (contentConfig) {
        // Generate fields based on content configuration
        fields = Object.entries(contentConfig)
          .filter(([key, selected]) => selected === true)
          .map(([key]) => {
            // Convert content config keys to field definitions
            const fieldMap: Record<string, any> = {
              name: { type: 'text', field: 'name', x: 20, y: 30, fontSize: 14, fontWeight: 'bold' },
              sku: { type: 'text', field: 'sku', x: 20, y: 50, fontSize: 10 },
              barcode: { type: 'barcode', field: 'sku', x: 20, y: 70, format: 'CODE128', width: 150, height: 30 },
              qrCode: { type: 'qr', field: 'item_data', x: 180, y: 70, size: 40 },
              lotNumber: { type: 'text', field: 'lot_number', x: 20, y: 110, fontSize: 9, fontWeight: 'bold' },
              expirationDate: { type: 'text', field: 'expiration_date', x: 120, y: 110, fontSize: 9 },
              category: { type: 'text', field: 'category', x: 20, y: 130, fontSize: 8 },
              vendor: { type: 'text', field: 'vendor', x: 120, y: 130, fontSize: 8 }
            };
            return fieldMap[key];
          })
          .filter(Boolean);
      }

      const content = fields.map((field: any) => ({
        type: field.type,
        value: labelData[field.field as keyof typeof labelData] || field.field,
        x: field.x,
        y: field.y,
        options: {
          fontSize: field.fontSize,
          width: field.width,
          height: field.height,
          format: field.format,
          size: field.size
        }
      }));

      const pdf = BarcodeGenerator.createLabelPDF(content, dimensions);
      pdf.save(`reprint-${item.name}-${lotNumber || 'batch'}-${Date.now()}.pdf`);
      
      toast.success('Label reprinted successfully');
    } catch (error) {
      console.error('Error reprinting label:', error);
      toast.error('Failed to reprint label');
    }
  };

  const getTemplatePreview = () => {
    if (!selectedTemplate) return null;

    const templateData = selectedTemplate.template_data as any;
    const contentConfig = templateData.content_config;

    if (contentConfig) {
      const selectedFields = Object.entries(contentConfig)
        .filter(([key, selected]) => selected === true)
        .map(([key]) => key);

      return (
        <div className="flex flex-wrap gap-2">
          {selectedFields.map((field) => (
            <Badge key={field} variant="secondary" className="text-xs">
              {field.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}
            </Badge>
          ))}
        </div>
      );
    }

    return <div className="text-sm text-muted-foreground">Template fields configured</div>;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Loading templates...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reprint Labels
          </DialogTitle>
          <DialogDescription>
            {item ? `Reprint labels for ${item.name} with updated information` : 'Reprint labels from saved templates'}
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-2">No saved templates found</p>
              <p className="text-sm text-muted-foreground">
                Create labels first and save them as templates to enable reprinting
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="template-select">Saved Template</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template to reprint" />
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

            {selectedTemplate && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Template Contents</h4>
                  {getTemplatePreview()}
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot-number">Lot Number</Label>
                <Input
                  id="lot-number"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="Enter new lot number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration-date">Expiration Date</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="printer-type">Printer Type</Label>
                <Select value={printerType} onValueChange={(value: any) => setPrinterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universal">Universal (PDF)</SelectItem>
                    <SelectItem value="zebra">Zebra (ZPL)</SelectItem>
                    <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="dymo">DYMO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={!selectedTemplate || !item}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              onClick={handleReprint}
              disabled={!selectedTemplate || !item}
            >
              <Printer className="h-4 w-4 mr-2" />
              Reprint ({quantity})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};