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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { InventoryItem } from '@/contexts/inventory/types';
import { InventoryLot } from '@/contexts/inventory/api/inventoryLots';
import { Printer, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
  lot?: InventoryLot;
  initialTemplate?: LabelTemplate;
}

export const LabelPrintDialog: React.FC<LabelPrintDialogProps> = ({
  open,
  onOpenChange,
  item,
  lot,
  initialTemplate
}) => {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(initialTemplate || null);
  const [quantity, setQuantity] = useState(1);
  const [printerType, setPrinterType] = useState<'universal' | 'zebra' | 'brother' | 'dymo'>('universal');
  const [labelPreview, setLabelPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const data = await labelTemplatesApi.getAll();
      setTemplates(data);
      
      if (!selectedTemplate && data.length > 0) {
        // Select first template that matches the context
        const contextTemplate = item && !lot 
          ? data.find(t => t.category === 'product')
          : lot 
          ? data.find(t => t.category === 'lot')
          : data[0];
        
        setSelectedTemplate(contextTemplate || data[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load label templates');
    }
  };

  const generateLabelData = () => {
    if (!selectedTemplate || !item) return {};

    return {
      name: item.name,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || '',
      category: item.category?.name || '',
      vendor: item.vendor?.name || '',
      location: item.location || '',
      current_stock: item.current_stock,
      unit: item.base_unit?.name || '',
      lot_number: lot?.lot_number || '',
      manufacturing_date: lot?.manufacturing_date || '',
      expiration_date: lot?.expiration_date || '',
      quantity_received: lot?.quantity_received || '',
      quantity_remaining: lot?.quantity_remaining || '',
      item_data: JSON.stringify({
        id: item.id,
        name: item.name,
        sku: item.sku,
        lot: lot?.lot_number
      })
    };
  };

  const generatePreview = async () => {
    if (!selectedTemplate || !item) {
      setLabelPreview('');
      return;
    }

    const labelData = generateLabelData();
    const template = selectedTemplate.template_data as any;
    
    if (!template?.fields) {
      setLabelPreview('');
      return;
    }

    // Create a simple HTML preview
    const dimensions = selectedTemplate.dimensions as any;
    const width = (dimensions?.width || 2) * 72; // Convert to pixels (rough estimate)
    const height = (dimensions?.height || 1) * 72;

    let previewHTML = `
      <div style="
        width: ${width}px; 
        height: ${height}px; 
        border: 1px solid #ccc; 
        position: relative; 
        background: white;
        overflow: hidden;
      ">
    `;

    for (const field of template.fields) {
      const value = labelData[field.field as keyof typeof labelData] || field.field;
      
      if (field.type === 'text') {
        previewHTML += `
          <div style="
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            font-size: ${field.fontSize || 12}px;
            font-weight: ${field.fontWeight || 'normal'};
            color: ${field.color || '#000'};
            text-align: ${field.align || 'left'};
          ">${value}</div>
        `;
      } else if (field.type === 'barcode') {
        try {
          const barcodeImg = BarcodeGenerator.generateBarcode(String(value), {
            format: field.format as any || 'CODE128',
            width: field.width ? field.width / 50 : 2,
            height: field.height || 30,
            displayValue: true
          });
          
          if (barcodeImg) {
            previewHTML += `
              <img src="${barcodeImg}" style="
                position: absolute;
                left: ${field.x}px;
                top: ${field.y}px;
                max-width: ${field.width || 100}px;
                max-height: ${field.height || 30}px;
              " />
            `;
          }
        } catch (error) {
          console.error('Error generating barcode preview:', error);
        }
      } else if (field.type === 'qr') {
        try {
          const qrImg = await BarcodeGenerator.generateQRCode(String(value), {
            width: field.size || 40
          });
          
          if (qrImg) {
            previewHTML += `
              <img src="${qrImg}" style="
                position: absolute;
                left: ${field.x}px;
                top: ${field.y}px;
                width: ${field.size || 40}px;
                height: ${field.size || 40}px;
              " />
            `;
          }
        } catch (error) {
          console.error('Error generating QR code preview:', error);
        }
      }
    }

    previewHTML += '</div>';
    setLabelPreview(previewHTML);
  };

  useEffect(() => {
    if (selectedTemplate && item) {
      generatePreview();
    }
  }, [selectedTemplate, item, lot]);

  const handlePrint = () => {
    if (!selectedTemplate || !item) {
      toast.error('Please select a template and ensure item data is available');
      return;
    }

    if (printerType === 'universal') {
      // Generate PDF and print
      handleDownloadPDF();
    } else {
      // Generate printer-specific commands
      toast.info(`${printerType} printer support is coming soon!`);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedTemplate || !item) return;

    try {
      const labelData = generateLabelData();
      const template = selectedTemplate.template_data as any;
      const dimensions = selectedTemplate.dimensions as any;

      const content = template.fields?.map((field: any) => ({
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
      })) || [];

      const pdf = BarcodeGenerator.createLabelPDF(content, dimensions);
      pdf.save(`label-${item.name}-${Date.now()}.pdf`);
      
      toast.success('Label PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate label PDF');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
          <DialogDescription>
            {item ? `Generate labels for ${item.name}` : 'Generate custom labels'}
            {lot && ` (Lot: ${lot.lot_number})`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-select">Label Template</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
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

            <div className="grid grid-cols-2 gap-4">
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

            {selectedTemplate && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Template Info</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Category: {selectedTemplate.category}</div>
                    <div>Dimensions: {(selectedTemplate.dimensions as any)?.width || 2}" × {(selectedTemplate.dimensions as any)?.height || 1}"</div>
                    <div>Printer: {selectedTemplate.printer_type}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Label>Label Preview</Label>
            {labelPreview ? (
              <Card>
                <CardContent className="p-4">
                  <div 
                    className="border rounded bg-white flex items-center justify-center min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: labelPreview }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  Select a template to see preview
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print ({quantity})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};