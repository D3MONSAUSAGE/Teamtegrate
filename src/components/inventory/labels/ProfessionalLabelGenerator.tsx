import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { InventoryItem } from '@/contexts/inventory/types';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Barcode, FileText, Download, Building2, Hash, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
}

const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Product Label',
    description: 'Company name, product name, SKU, barcode, lot code',
    fields: ['company', 'product', 'sku', 'barcode', 'lot']
  },
  {
    id: 'food',
    name: 'Food Safety Label',
    description: 'Complete food label with nutrition facts and ingredients',
    fields: ['company', 'product', 'sku', 'barcode', 'lot', 'nutrition', 'ingredients', 'allergens']
  },
  {
    id: 'custom',
    name: 'Custom Label',
    description: 'Choose your own fields',
    fields: ['company', 'product', 'barcode']
  }
];

export const ProfessionalLabelGenerator: React.FC = () => {
  const { items } = useEnhancedInventoryManagement();
  const { user } = useAuth();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic');
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Company and lot code state
  const [companyName, setCompanyName] = useState('');
  const [lotCode, setLotCode] = useState('');

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set default company name
  useEffect(() => {
    setCompanyName('Your Company Name');
  }, []);

  // Generate lot code when item changes
  useEffect(() => {
    if (selectedItem) {
      const companyPrefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const lotNumber = BarcodeGenerator.generateLotNumber(companyPrefix || 'LOT');
      setLotCode(lotNumber);
    }
  }, [selectedItem, companyName]);

  // Load item when selected
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      setSelectedItem(item || null);
      
      if (item) {
        loadNutritionalInfo(item.id);
      }
    } else {
      setSelectedItem(null);
      setNutritionalInfo(null);
    }
  }, [selectedItemId, items]);

  const loadNutritionalInfo = async (itemId: string) => {
    try {
      const data = await nutritionalInfoApi.getByItemId(itemId);
      setNutritionalInfo(data);
    } catch (error) {
      console.error('Failed to load nutritional info:', error);
    }
  };

  const generateLabel = async () => {
    if (!selectedItem) {
      toast.error('Please select a product first');
      return;
    }

    const template = LABEL_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6] // 4x6 inch thermal label
      });

      pdf.setFont('helvetica');
      let y = 0.3;

      // Company Header (always included)
      if (companyName) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(companyName.toUpperCase(), 2, y, { align: 'center' });
        y += 0.3;
        
        // Divider line
        pdf.setLineWidth(0.01);
        pdf.line(0.2, y, 3.8, y);
        y += 0.2;
      }

      // Product Name
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedItem.name, 2, y, { align: 'center' });
      y += 0.4;

      // SKU
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`SKU: ${selectedItem.sku || 'N/A'}`, 0.2, y);
      y += 0.25;

      // Lot Code
      if (template.fields.includes('lot')) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`LOT: ${lotCode}`, 0.2, y);
        
        // Date on right side
        const currentDate = new Date().toLocaleDateString();
        pdf.text(`DATE: ${currentDate}`, 3.8, y, { align: 'right' });
        y += 0.3;
      }

      // Barcode (always included)
      try {
        const barcodeValue = selectedItem.barcode || selectedItem.sku || lotCode;
        const barcodeImage = BarcodeGenerator.generateBarcode(barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: true,
          background: '#ffffff',
          lineColor: '#000000'
        });
        
        if (barcodeImage) {
          pdf.addImage(barcodeImage, 'PNG', 0.5, y, 3, 0.6);
          y += 0.8;
        }
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }

      // Nutrition Facts (if included)
      if (template.fields.includes('nutrition') && nutritionalInfo) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nutrition Facts', 0.2, y);
        y += 0.2;

        // Nutrition box
        pdf.setLineWidth(0.02);
        pdf.rect(0.2, y, 3.6, 1.2);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        y += 0.15;

        const nutritionItems = [
          { label: 'Serving Size', value: nutritionalInfo.serving_size },
          { label: 'Calories', value: nutritionalInfo.calories, bold: true },
          { label: 'Total Fat', value: nutritionalInfo.total_fat, unit: 'g' },
          { label: 'Sodium', value: nutritionalInfo.sodium, unit: 'mg' },
          { label: 'Total Carbs', value: nutritionalInfo.total_carbohydrates, unit: 'g' },
          { label: 'Protein', value: nutritionalInfo.protein, unit: 'g' },
        ];

        nutritionItems.forEach(item => {
          if (item.value !== null && item.value !== undefined) {
            pdf.setFont('helvetica', item.bold ? 'bold' : 'normal');
            const text = `${item.label}: ${item.value}${item.unit || ''}`;
            pdf.text(text, 0.3, y);
            y += 0.12;
          }
        });
        
        y += 0.15;
      }

      // Ingredients (if included)
      if (template.fields.includes('ingredients') && nutritionalInfo?.ingredients) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INGREDIENTS:', 0.2, y);
        y += 0.15;
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const ingredients = pdf.splitTextToSize(nutritionalInfo.ingredients, 3.6);
        pdf.text(ingredients, 0.2, y);
        y += (ingredients.length * 0.08) + 0.1;
      }

      // Allergens (if included)
      if (template.fields.includes('allergens') && nutritionalInfo?.allergens?.length) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CONTAINS:', 0.2, y);
        y += 0.15;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(nutritionalInfo.allergens.join(', ').toUpperCase(), 0.2, y);
      }

      // Footer with company branding
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated by ${companyName} - ${new Date().toLocaleDateString()}`, 2, 5.8, { align: 'center' });

      // Save PDF
      const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${selectedItem.name.replace(/[^a-zA-Z0-9]/g, '-')}-${template.id}.pdf`;
      pdf.save(filename);
      
      toast.success('Professional label generated successfully!');
      
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const LabelForm = () => (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Select Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a product..." />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.name}</span>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {item.sku || 'No SKU'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Template Selection */}
      {selectedItem && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Label Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {LABEL_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.fields.includes('nutrition') && <Badge variant="outline" className="text-xs">Nutrition</Badge>}
                    {template.fields.includes('ingredients') && <Badge variant="outline" className="text-xs">Ingredients</Badge>}
                    {template.fields.includes('allergens') && <Badge variant="outline" className="text-xs">Allergens</Badge>}
                    <Badge variant="outline" className="text-xs">Barcode</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lot Code & Barcode Info */}
      {selectedItem && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5 text-primary" />
              Codes & Identification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Generated Lot Code</Label>
                <div className="mt-1 p-2 bg-muted/50 rounded border">
                  <code className="text-sm font-mono">{lotCode}</code>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Barcode Value</Label>
                <div className="mt-1 p-2 bg-muted/50 rounded border">
                  <code className="text-sm font-mono">
                    {selectedItem.barcode || selectedItem.sku || lotCode}
                  </code>
                </div>
              </div>
              <div className="col-span-full">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutritional Status */}
      {selectedItem && LABEL_TEMPLATES.find(t => t.id === selectedTemplate)?.fields.some(f => ['nutrition', 'ingredients', 'allergens'].includes(f)) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Nutritional Information</CardTitle>
            <CardDescription>
              {nutritionalInfo ? (
                <span className="text-green-600 font-medium flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Using existing nutritional data
                </span>
              ) : (
                <span className="text-amber-600 font-medium flex items-center gap-2">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                  No nutritional data found - label will generate without nutrition facts
                </span>
              )}
            </CardDescription>
          </CardHeader>
          {nutritionalInfo && (
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {nutritionalInfo.serving_size && (
                  <div><span className="text-muted-foreground">Serving:</span> {nutritionalInfo.serving_size}</div>
                )}
                {nutritionalInfo.calories && (
                  <div><span className="text-muted-foreground">Calories:</span> {nutritionalInfo.calories}</div>
                )}
                {nutritionalInfo.ingredients && (
                  <div className="col-span-2"><span className="text-muted-foreground">Ingredients:</span> Available</div>
                )}
                {nutritionalInfo.allergens?.length && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Allergens:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nutritionalInfo.allergens.map(allergen => (
                        <Badge key={allergen} variant="secondary" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Generate Button */}
      {selectedItem && (
        <Button 
          onClick={generateLabel}
          disabled={isGenerating || !companyName.trim()}
          className="w-full py-6 text-lg"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          {isGenerating ? 'Generating...' : 'Generate Professional Label'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Professional Label Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate professional labels with company branding, barcodes, and nutritional information
        </p>
      </div>

      {/* Mobile: Use Drawer, Desktop: Regular Layout */}
      {isMobile ? (
        <div className="p-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="w-full py-6 text-lg">
                <Barcode className="mr-2 h-5 w-5" />
                Create Label
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Generate Label</DrawerTitle>
                <DrawerDescription>
                  Configure your professional label
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-8 max-h-[80vh] overflow-y-auto">
                <LabelForm />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      ) : (
        <div className="p-6">
          <LabelForm />
        </div>
      )}
    </div>
  );
};