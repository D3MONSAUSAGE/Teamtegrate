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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { LabelTemplate, labelTemplatesApi } from '@/contexts/inventory/api/labelTemplates';
import { InventoryItem } from '@/contexts/inventory/types';
import { InventoryLot, inventoryLotsApi } from '@/contexts/inventory/api/inventoryLots';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { LabelContentSelector, LabelContentConfig } from './LabelContentSelector';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { Printer, Download, FileText, Save, Settings, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useInventory } from '@/contexts/inventory';

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
  const { items } = useInventory();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(initialTemplate || null);
  const [selectedItemId, setSelectedItemId] = useState<string>(item?.id || '');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(lot?.id || null);
  const [availableLots, setAvailableLots] = useState<InventoryLot[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [printerType, setPrinterType] = useState<'universal' | 'zebra' | 'brother' | 'dymo'>('universal');
  const [labelPreview, setLabelPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('template');
  
  // Content configuration state
  const [contentConfig, setContentConfig] = useState<LabelContentConfig>({
    name: true,
    sku: true,
    barcode: true,
    qrCode: false,
    vendor: false,
    location: false,
    currentStock: false,
    productImage: false,
    lotNumber: !!lot,
    manufacturingDate: !!lot,
    expirationDate: !!lot,
    nutritionalFacts: false,
    ingredients: false,
    allergens: false,
    servingSize: false,
    customText: ''
  });

  useEffect(() => {
    if (open) {
      loadTemplates();
      loadNutritionalInfo();
      loadAvailableLots();
      resetContentConfig();
    }
  }, [open, selectedItemId, lot]);

  // Update data when selectedItemId changes
  useEffect(() => {
    if (selectedItemId) {
      loadNutritionalInfo();
      loadAvailableLots();
    }
  }, [selectedItemId]);

  // Load available lots when item changes
  const loadAvailableLots = async () => {
    if (!selectedItemId) {
      setAvailableLots([]);
      return;
    }
    
    try {
      const lots = await inventoryLotsApi.getByItemId(selectedItemId);
      setAvailableLots(lots.filter(lot => lot.quantity_remaining > 0));
    } catch (error) {
      console.error('Error loading lots:', error);
      setAvailableLots([]);
    }
  };

  // Set smart defaults based on template category and available data
  const resetContentConfig = () => {
    const currentItem = items.find(i => i.id === selectedItemId);
    const hasNutritionalInfo = !!nutritionalInfo;
    const currentLot = availableLots.find(l => l.id === selectedLotId);
    const hasLotData = !!currentLot;
    const isFoodItem = currentItem?.name && ['asada', 'pastor', 'pollo', 'food'].some(food => 
      currentItem.name.toLowerCase().includes(food)
    );
    
    const smartDefaults: LabelContentConfig = {
      // Essential fields - always on
      name: true,
      sku: true,
      barcode: true,
      qrCode: false,
      
      // Context-aware defaults
      vendor: !!(currentItem?.vendor?.name),
      location: false,
      currentStock: false,
      productImage: !!(currentItem?.image_url),
      
      // Lot fields - auto-enable if lot data available
      lotNumber: hasLotData,
      manufacturingDate: hasLotData,
      expirationDate: hasLotData || isFoodItem,
      
      // Nutritional fields - smart defaults for food items
      nutritionalFacts: hasNutritionalInfo || isFoodItem,
      ingredients: hasNutritionalInfo || isFoodItem,
      allergens: hasNutritionalInfo,
      servingSize: hasNutritionalInfo || isFoodItem,
      
      customText: ''
    };
    
    setContentConfig(smartDefaults);
  };

  const loadNutritionalInfo = async () => {
    if (!selectedItemId) return;
    
    try {
      const data = await nutritionalInfoApi.getByItemId(selectedItemId);
      setNutritionalInfo(data);
      
      // Auto-enable nutritional fields if data exists
      if (data) {
        setContentConfig(prev => ({
          ...prev,
          nutritionalFacts: !!(data.calories || data.total_fat || data.protein),
          ingredients: !!data.ingredients?.trim(),
          allergens: !!(data.allergens && data.allergens.length > 0),
          servingSize: !!data.serving_size?.trim()
        }));
      }
    } catch (error) {
      console.error('Error loading nutritional info:', error);
    }
  };

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
    if (!selectedTemplate || !selectedItemId) return {};
    
    const currentItem = items.find(i => i.id === selectedItemId);
    const currentLot = availableLots.find(l => l.id === selectedLotId);
    
    if (!currentItem) return {};

    // Generate fallback data for missing fields to improve usability
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    
    return {
      name: currentItem.name,
      sku: currentItem.sku || '',
      barcode: currentItem.barcode || currentItem.sku || '',
      vendor: currentItem.vendor?.name || 'Supplier',
      location: currentItem.location || 'Warehouse',
      current_stock: currentItem.current_stock || 0,
      image_url: currentItem.image_url || '',
      lot_number: currentLot?.lot_number || `LOT-${Date.now().toString().slice(-6)}`,
      manufacturing_date: currentLot?.manufacturing_date || today,
      expiration_date: currentLot?.expiration_date || futureDate.toISOString().split('T')[0],
      quantity_received: currentLot?.quantity_received || 50,
      quantity_remaining: currentLot?.quantity_remaining || 45,
      item_data: JSON.stringify({
        id: currentItem.id,
        name: currentItem.name,
        sku: currentItem.sku,
        lot: currentLot?.lot_number || 'BATCH-001'
      }),
      // Use actual nutritional data from database with intelligent fallbacks
      ingredients: nutritionalInfo?.ingredients || (
        currentItem.name?.toLowerCase().includes('asada') ? 'Beef chuck roast, onions, garlic, bay leaves, cumin, black pepper, salt, beef broth, lime juice, cilantro' :
        currentItem.name?.toLowerCase().includes('pastor') ? 'Pork shoulder, pineapple, onions, garlic, achiote paste, orange juice, white vinegar, cumin, oregano, chipotle peppers, salt' :
        currentItem.name?.toLowerCase().includes('pollo') ? 'Chicken thighs, lime juice, orange juice, garlic, cumin, chili powder, paprika, oregano, salt, black pepper, olive oil' :
        currentItem.name?.toLowerCase().includes('collagen') ? 'Hydrolyzed collagen peptides, natural flavors, stevia leaf extract' :
        'See package for complete ingredient list'
      ),
      allergens: nutritionalInfo?.allergens?.join(', ') || 'None known',
      serving_size: nutritionalInfo?.serving_size || (
        currentItem.name?.toLowerCase().includes('collagen') ? '1 scoop (10g)' : '4 oz (113g)'
      ),
      calories: nutritionalInfo?.calories || (
        currentItem.name?.toLowerCase().includes('asada') ? 290 :
        currentItem.name?.toLowerCase().includes('pastor') ? 275 :
        currentItem.name?.toLowerCase().includes('pollo') ? 195 :
        currentItem.name?.toLowerCase().includes('collagen') ? 40 : 250
      ),
      total_fat: nutritionalInfo?.total_fat || (
        currentItem.name?.toLowerCase().includes('collagen') ? 0 : 15
      ),
      protein: nutritionalInfo?.protein || (
        currentItem.name?.toLowerCase().includes('asada') ? 28 :
        currentItem.name?.toLowerCase().includes('pastor') ? 27 :
        currentItem.name?.toLowerCase().includes('pollo') ? 36 :
        currentItem.name?.toLowerCase().includes('collagen') ? 9 : 20
      ),
      total_carbohydrates: nutritionalInfo?.total_carbohydrates || (
        currentItem.name?.toLowerCase().includes('collagen') ? 0 : 3
      ),
      sodium: nutritionalInfo?.sodium || (
        currentItem.name?.toLowerCase().includes('collagen') ? 35 : 350
      )
    };
  };

  const generateFieldsFromContentConfig = () => {
    const fields: any[] = [];
    
    // 4x6 thermal label optimization (288x432 points)
    const THERMAL_WIDTH = 288;
    const THERMAL_HEIGHT = 432;
    const MARGIN = 15;
    const usableWidth = THERMAL_WIDTH - (MARGIN * 2);
    
    let yOffset = MARGIN + 10;

    // Product image - positioned at top right if enabled
    if (contentConfig.productImage) {
      fields.push({
        type: 'image',
        field: 'image_url',
        x: THERMAL_WIDTH - MARGIN - 60,
        y: yOffset,
        width: 60,
        height: 60
      });
    }

    // Product name - prominent at top
    if (contentConfig.name) {
      fields.push({
        type: 'text',
        field: 'name',
        x: MARGIN,
        y: yOffset,
        fontSize: 14,
        fontWeight: 'bold',
        width: usableWidth
      });
      yOffset += 20;
    }

    // SKU - smaller below name
    if (contentConfig.sku) {
      fields.push({
        type: 'text',
        field: 'sku',
        x: MARGIN,
        y: yOffset,
        fontSize: 9,
        fontWeight: 'normal'
      });
      yOffset += 16;
    }

    // Barcode - thermal optimized size
    if (contentConfig.barcode) {
      fields.push({
        type: 'barcode',
        field: 'sku',
        x: MARGIN,
        y: yOffset,
        format: 'CODE128',
        width: 180,
        height: 25
      });
      yOffset += 35;
    }

    // QR Code - compact size, positioned on right if barcode exists
    if (contentConfig.qrCode) {
      const qrX = contentConfig.barcode ? THERMAL_WIDTH - MARGIN - 35 : MARGIN;
      const qrY = contentConfig.barcode ? yOffset - 35 : yOffset;
      fields.push({
        type: 'qr',
        field: 'item_data',
        x: qrX,
        y: qrY,
        size: 35
      });
      if (!contentConfig.barcode) yOffset += 40;
    }

    // Vendor info if enabled
    if (contentConfig.vendor) {
      fields.push({
        type: 'text',
        field: 'vendor',
        x: MARGIN,
        y: yOffset,
        fontSize: 8,
        fontWeight: 'normal'
      });
      yOffset += 14;
    }

    // Lot info - compact format
    if (contentConfig.lotNumber) {
      fields.push({
        type: 'text',
        field: 'lot_number',
        x: MARGIN,
        y: yOffset,
        fontSize: 9,
        fontWeight: 'bold'
      });
      
      // Expiration date on same line if present
      if (contentConfig.expirationDate) {
        fields.push({
          type: 'text',
          field: 'expiration_date',
          x: MARGIN + 100,
          y: yOffset,
          fontSize: 9,
          fontWeight: 'bold'
        });
      }
      yOffset += 16;
    } else if (contentConfig.expirationDate) {
      fields.push({
        type: 'text',
        field: 'expiration_date',
        x: MARGIN,
        y: yOffset,
        fontSize: 9,
        fontWeight: 'bold'
      });
      yOffset += 16;
    }

    // Nutritional facts - compact thermal format
    if (contentConfig.nutritionalFacts) {
      fields.push({
        type: 'nutritional_facts',
        field: 'nutritional_info',
        x: MARGIN,
        y: yOffset,
        fontSize: 7,
        width: usableWidth,
        height: 120,
        compact: true
      });
      yOffset += 130;
    }

    // Ingredients - word wrapped
    if (contentConfig.ingredients) {
      fields.push({
        type: 'ingredients_list',
        field: 'ingredients',
        x: MARGIN,
        y: yOffset,
        fontSize: 6,
        width: usableWidth,
        maxLines: 4
      });
      yOffset += 30;
    }

    // Allergens - prominent warning
    if (contentConfig.allergens) {
      fields.push({
        type: 'allergen_warning',
        field: 'allergens',
        x: MARGIN,
        y: yOffset,
        fontSize: 7,
        fontWeight: 'bold',
        width: usableWidth
      });
      yOffset += 16;
    }

    // Additional fields for thermal optimization
    if (contentConfig.location) {
      fields.push({
        type: 'text',
        field: 'location',
        x: MARGIN,
        y: yOffset,
        fontSize: 7
      });
      yOffset += 12;
    }

    if (contentConfig.currentStock) {
      fields.push({
        type: 'text',
        field: 'current_stock',
        x: MARGIN,
        y: yOffset,
        fontSize: 7
      });
    }

    return fields;
  };

  const generatePreview = async () => {
    const currentItem = items.find(i => i.id === selectedItemId);
    if (!currentItem) {
      setLabelPreview('');
      return;
    }

    const labelData = generateLabelData();
    let fields = generateFieldsFromContentConfig();

    // Use template fields if available and no custom content config
    if (selectedTemplate?.template_data) {
      const templateData = selectedTemplate.template_data as any;
      if (templateData.fields && !templateData.content_config) {
        fields = templateData.fields;
      }
    }

    if (fields.length === 0) {
      setLabelPreview('');
      return;
    }

    // Create a thermal-optimized HTML preview for 4x6 labels
    const dimensions = selectedTemplate?.dimensions as any || { width: 4, height: 6 };
    const width = (dimensions?.width || 4) * 72; // 4 inches = 288px
    const height = (dimensions?.height || 6) * 72; // 6 inches = 432px

    let previewHTML = `
      <div style="
        width: ${width}px; 
        height: ${height}px; 
        border: 2px solid #333; 
        position: relative; 
        background: white;
        overflow: hidden;
        font-family: 'Courier New', monospace;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      ">
    `;

    for (const field of fields) {
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
      } else if (field.type === 'image') {
        if (value && value !== '') {
          previewHTML += `
            <img src="${value}" style="
              position: absolute;
              left: ${field.x}px;
              top: ${field.y}px;
              width: ${field.width || 60}px;
              height: ${field.height || 60}px;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 4px;
            " onerror="this.style.display='none'" />
          `;
        } else {
          // Show placeholder for missing image
          previewHTML += `
            <div style="
              position: absolute;
              left: ${field.x}px;
              top: ${field.y}px;
              width: ${field.width || 60}px;
              height: ${field.height || 60}px;
              border: 2px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #999;
              background: #f5f5f5;
            ">
              No Image
            </div>
          `;
        }
      } else if (field.type === 'nutritional_facts') {
        const nutritionData = {
          servingSize: labelData.serving_size,
          calories: labelData.calories,
          totalFat: labelData.total_fat,
          protein: labelData.protein,
          totalCarbs: labelData.total_carbohydrates,
          sodium: labelData.sodium
        };
        
        previewHTML += `
          <div style="
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.width || 120}px;
            height: ${field.height || 100}px;
            font-size: ${field.fontSize || 7}px;
            border: 1px solid #000;
            padding: 4px;
            background: white;
          ">
            <div style="font-weight: bold; font-size: ${(field.fontSize || 7) + 1}px;">Nutrition Facts</div>
            <div style="margin-top: 2px;">Serving: ${nutritionData.servingSize}</div>
            <div style="font-weight: bold; margin-top: 2px;">Calories: ${nutritionData.calories}</div>
            <hr style="margin: 2px 0; border: 0.5px solid #000;">
            <div>Total Fat: ${nutritionData.totalFat}g</div>
            <div>Sodium: ${nutritionData.sodium}mg</div>
            <div>Total Carbs: ${nutritionData.totalCarbs}g</div>
            <div>Protein: ${nutritionData.protein}g</div>
          </div>
        `;
      } else if (field.type === 'ingredients_list') {
        previewHTML += `
          <div style="
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.width || 200}px;
            font-size: ${field.fontSize || 6}px;
            font-weight: bold;
          ">
            <div style="font-weight: bold;">INGREDIENTS:</div>
            <div style="font-weight: normal; margin-top: 1px; line-height: 1.1;">
              ${String(value).substring(0, 150)}${String(value).length > 150 ? '...' : ''}
            </div>
          </div>
        `;
      } else if (field.type === 'allergen_warning') {
        previewHTML += `
          <div style="
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.width || 200}px;
            font-size: ${field.fontSize || 7}px;
            font-weight: bold;
            color: #d00;
          ">
            <div>ALLERGENS: ${value}</div>
          </div>
        `;
      }
    }

    previewHTML += '</div>';
    setLabelPreview(previewHTML);
  };

  useEffect(() => {
    if (item && (selectedTemplate || Object.values(contentConfig).some(v => v === true))) {
      generatePreview();
    }
  }, [selectedTemplate, item, lot, contentConfig, nutritionalInfo]);

  const handlePrint = () => {
    if (!item) {
      toast.error('Please select an item to print labels for');
      return;
    }

    if (printerType === 'universal') {
      handleDownloadPDF();
    } else {
      toast.info(`${printerType} printer support is coming soon!`);
    }
  };

  const handleDownloadPDF = () => {
    if (!item) return;

    try {
      const labelData = generateLabelData();
      let fields = generateFieldsFromContentConfig();
      const dimensions = selectedTemplate?.dimensions as any || { width: 4, height: 6, unit: 'inches' };

      // Use template fields if available
      if (selectedTemplate?.template_data) {
        const templateData = selectedTemplate.template_data as any;
        if (templateData.fields && !templateData.content_config) {
          fields = templateData.fields;
        }
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
          <DialogTitle>Generate Labels</DialogTitle>
          <DialogDescription>
            {item ? `Create custom labels for ${item.name}` : 'Create custom labels with flexible content selection'}
            {lot && ` (Lot: ${lot.lot_number})`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="template-select">Label Template</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                  
                  // Load template content config if available
                  if (template?.template_data) {
                    const templateData = template.template_data as any;
                    if (templateData.content_config) {
                      setContentConfig(templateData.content_config);
                    }
                  }
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
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <LabelContentSelector
              item={items.find(i => i.id === selectedItemId)}
              lot={availableLots.find(l => l.id === selectedLotId)}
              nutritionalInfo={nutritionalInfo}
              contentConfig={contentConfig}
              onContentChange={setContentConfig}
              templateCategory={selectedTemplate?.category}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-6">
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
                  Configure content and select a template to see preview
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSaveTemplateOpen(true)}
              disabled={!selectedItemId}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} disabled={!selectedItemId || loading}>
              <Printer className="h-4 w-4 mr-2" />
              Print ({quantity})
            </Button>
          </div>
        </div>

        <SaveTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={setSaveTemplateOpen}
          contentConfig={contentConfig}
          templateData={selectedTemplate?.template_data || {}}
          dimensions={selectedTemplate?.dimensions as any || { width: 4, height: 6, unit: 'inches' }}
          onTemplateSaved={(template) => {
            toast.success('Template saved! You can now find it in the Templates tab.');
            loadTemplates(); // Refresh template list
          }}
        />
      </DialogContent>
    </Dialog>
  );
};