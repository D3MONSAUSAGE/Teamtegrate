import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { nutritionalInfoApi, NutritionalInfo } from '@/contexts/inventory/api/nutritionalInfo';
import { labelTemplatesApi, LabelTemplate } from '@/contexts/inventory/api/labelTemplates';
import { InventoryItem } from '@/contexts/inventory/types';
import { ImageUpload } from '@/components/inventory/ImageUpload';
import { FoodLabelPreview } from './FoodLabelPreview';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { 
  Package, 
  Image, 
  FileText, 
  Download, 
  Save, 
  Palette, 
  Smartphone, 
  Eye,
  Settings,
  Star,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface DesignConfig {
  theme: 'modern' | 'classic' | 'minimal' | 'premium';
  logoPosition: 'top-left' | 'top-right' | 'center' | 'bottom';
  includeNutrition: boolean;
  includeIngredients: boolean;
  includeAllergens: boolean;
  includeBarcode: boolean;
  logoUrl?: string;
}

interface TemplateConfig extends DesignConfig {
  name: string;
  description?: string;
}

export const ProfessionalLabelDesigner: React.FC = () => {
  const { items } = useEnhancedInventoryManagement();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  const [config, setConfig] = useState<DesignConfig>({
    theme: 'modern',
    logoPosition: 'top-right',
    includeNutrition: true,
    includeIngredients: true,
    includeAllergens: true,
    includeBarcode: true,
  });

  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({
    ...config,
    name: '',
    description: '',
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load item data when selected
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
      setNutritionalInfo(null);
    }
  }, [selectedItemId, items]);

  // Fetch nutritional info when item is selected
  useEffect(() => {
    if (selectedItem) {
      nutritionalInfoApi.getByItemId(selectedItem.id).then(setNutritionalInfo);
    }
  }, [selectedItem]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const allTemplates = await labelTemplatesApi.getAll();
      setTemplates(allTemplates.filter(t => t.category === 'food_product'));
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const availableDataStats = useMemo(() => {
    if (!selectedItem) return { total: 0, available: 0 };
    
    let available = 1; // Basic info always available
    let total = 4; // Basic + nutrition + ingredients + allergens
    
    if (nutritionalInfo && (nutritionalInfo.calories || nutritionalInfo.total_fat)) available++;
    if (nutritionalInfo?.ingredients) available++;
    if (nutritionalInfo?.allergens?.length) available++;
    
    return { total, available };
  }, [selectedItem, nutritionalInfo]);

  const handleConfigChange = (key: keyof DesignConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (url: string | null) => {
    handleConfigChange('logoUrl', url);
  };

  const saveTemplate = async () => {
    if (!templateConfig.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      const template: Omit<LabelTemplate, 'id' | 'created_at' | 'updated_at'> = {
        organization_id: '', // Will be set by API
        created_by: '', // Will be set by API
        name: templateConfig.name,
        description: templateConfig.description || undefined,
        category: 'food_product',
        printer_type: 'thermal',
        is_default: false,
        is_active: true,
        dimensions: {
          width: 4,
          height: 6,
          unit: 'inches'
        },
        template_data: {
          theme: templateConfig.theme,
          logoPosition: templateConfig.logoPosition,
          logoUrl: templateConfig.logoUrl,
          fields: [
            { type: 'text', field: 'name', included: true },
            { type: 'barcode', field: 'sku', included: templateConfig.includeBarcode },
            { type: 'nutritional_facts', field: 'nutritional_info', included: templateConfig.includeNutrition },
            { type: 'ingredients_list', field: 'ingredients', included: templateConfig.includeIngredients },
            { type: 'allergen_warning', field: 'allergens', included: templateConfig.includeAllergens },
          ]
        }
      };

      await labelTemplatesApi.create(template);
      toast.success('Template saved successfully!');
      loadTemplates();
      setTemplateConfig({ ...config, name: '', description: '' });
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const template = await labelTemplatesApi.getById(templateId);
      if (template?.template_data) {
        const data = template.template_data;
        const newConfig: DesignConfig = {
          theme: data.theme || 'modern',
          logoPosition: data.logoPosition || 'top-right',
          logoUrl: data.logoUrl,
          includeNutrition: data.fields?.find((f: any) => f.type === 'nutritional_facts')?.included ?? true,
          includeIngredients: data.fields?.find((f: any) => f.type === 'ingredients_list')?.included ?? true,
          includeAllergens: data.fields?.find((f: any) => f.type === 'allergen_warning')?.included ?? true,
          includeBarcode: data.fields?.find((f: any) => f.type === 'barcode')?.included ?? true,
        };
        setConfig(newConfig);
        toast.success(`Template "${template.name}" loaded successfully!`);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  const generateHighQualityPDF = async () => {
    if (!selectedItem) {
      toast.error('Please select a product first');
      return;
    }

    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6] // 4x6 inch label
      });

      pdf.setFont('helvetica');
      let y = 0.3;
      
      // Logo handling
      if (config.logoUrl && config.logoPosition !== 'bottom') {
        try {
          const logoY = config.logoPosition === 'top-left' || config.logoPosition === 'top-right' ? 0.2 : 0.4;
          const logoX = config.logoPosition === 'top-right' ? 2.5 : config.logoPosition === 'center' ? 1.5 : 0.2;
          pdf.addImage(config.logoUrl, 'PNG', logoX, logoY, 1, 0.8);
          if (config.logoPosition === 'center') y = 1.4;
        } catch (error) {
          console.warn('Failed to add logo to PDF:', error);
        }
      }

      // Product Name - Enhanced typography
      pdf.setFontSize(config.theme === 'premium' ? 22 : 18);
      pdf.setFont('helvetica', 'bold');
      const productName = selectedItem.name.toUpperCase();
      pdf.text(productName, 2, y, { align: 'center' });
      y += 0.4;

      // SKU with modern styling
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`SKU: ${selectedItem.sku || 'N/A'}`, 0.2, y);
      y += 0.3;

      // Barcode generation
      if (config.includeBarcode) {
        try {
          const barcodeValue = selectedItem.barcode || selectedItem.sku || selectedItem.id;
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
      }

      // Nutrition Facts with enhanced layout
      if (config.includeNutrition && nutritionalInfo) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nutrition Facts', 0.2, y);
        y += 0.2;

        // Draw nutrition facts box with rounded appearance
        pdf.setLineWidth(0.02);
        pdf.rect(0.2, y, 3.6, 1.8);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        y += 0.2;

        const nutritionData = [
          { label: 'Serving Size', value: nutritionalInfo.serving_size },
          { label: 'Calories', value: nutritionalInfo.calories, bold: true },
          { label: 'Total Fat', value: nutritionalInfo.total_fat, unit: 'g' },
          { label: 'Sodium', value: nutritionalInfo.sodium, unit: 'mg' },
          { label: 'Total Carbs', value: nutritionalInfo.total_carbohydrates, unit: 'g' },
          { label: 'Protein', value: nutritionalInfo.protein, unit: 'g' },
        ];

        nutritionData.forEach(item => {
          if (item.value !== null && item.value !== undefined) {
            pdf.setFont('helvetica', item.bold ? 'bold' : 'normal');
            const text = `${item.label}: ${item.value}${item.unit || ''}`;
            pdf.text(text, 0.3, y);
            y += 0.15;
          }
        });
        
        y += 0.2;
      }

      // Ingredients with better formatting
      if (config.includeIngredients && nutritionalInfo?.ingredients) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INGREDIENTS:', 0.2, y);
        y += 0.2;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const ingredients = pdf.splitTextToSize(nutritionalInfo.ingredients, 3.6);
        pdf.text(ingredients, 0.2, y);
        y += (ingredients.length * 0.1) + 0.2;
      }

      // Allergens with warning styling
      if (config.includeAllergens && nutritionalInfo?.allergens?.length) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALLERGEN WARNING:', 0.2, y);
        y += 0.2;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Contains: ${nutritionalInfo.allergens.join(', ')}`, 0.2, y);
        y += 0.2;
      }

      // Bottom logo
      if (config.logoUrl && config.logoPosition === 'bottom') {
        try {
          pdf.addImage(config.logoUrl, 'PNG', 1.5, 5.2, 1, 0.6);
        } catch (error) {
          console.warn('Failed to add bottom logo:', error);
        }
      }

      // Professional footer
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()} | ${config.theme.toUpperCase()} Theme`, 2, 5.8, { align: 'center' });

      // Save with descriptive filename
      const filename = `${config.theme}-label-${selectedItem.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      pdf.save(filename);
      
      toast.success('High-quality label generated successfully!');
      
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const themeOptions = [
    { value: 'modern', label: 'Modern', icon: Sparkles, color: 'bg-gradient-to-r from-blue-500 to-purple-600' },
    { value: 'classic', label: 'Classic', icon: FileText, color: 'bg-gradient-to-r from-slate-600 to-slate-800' },
    { value: 'minimal', label: 'Minimal', icon: Package, color: 'bg-gradient-to-r from-gray-400 to-gray-600' },
    { value: 'premium', label: 'Premium', icon: Star, color: 'bg-gradient-to-r from-yellow-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Professional Label Designer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create stunning, FDA-compliant food labels with real-time preview, logo integration, and professional templates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Product Selection */}
            <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  Step 1: Select Product
                </CardTitle>
                <CardDescription>Choose your inventory item and see available data</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an inventory item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="ml-2">
                            SKU: {item.sku || 'N/A'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedItem && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Data Availability:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {availableDataStats.available}/{availableDataStats.total} Available
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Design & Logo */}
            {selectedItem && (
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    Step 2: Design & Logo
                  </CardTitle>
                  <CardDescription>Customize appearance and upload your brand logo</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="design" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="design">Design Theme</TabsTrigger>
                      <TabsTrigger value="logo">Logo Upload</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="design" className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {themeOptions.map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => handleConfigChange('theme', theme.value)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              config.theme === theme.value 
                                ? 'border-primary shadow-lg scale-105' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className={`w-full h-12 rounded-lg ${theme.color} mb-2 flex items-center justify-center`}>
                              <theme.icon className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-medium">{theme.label}</p>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label>Logo Position</Label>
                        <Select value={config.logoPosition} onValueChange={(value) => handleConfigChange('logoPosition', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="logo" className="space-y-4">
                      <ImageUpload 
                        value={config.logoUrl}
                        onChange={handleLogoUpload}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Content Selection */}
            {selectedItem && (
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    Step 3: Content Selection
                  </CardTitle>
                  <CardDescription>Choose what information to include on your label</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'includeBarcode', label: 'Barcode', available: true, desc: 'Product barcode and SKU' },
                    { key: 'includeNutrition', label: 'Nutrition Facts', available: !!(nutritionalInfo && (nutritionalInfo.calories || nutritionalInfo.total_fat)), desc: 'FDA-compliant nutrition panel' },
                    { key: 'includeIngredients', label: 'Ingredients', available: !!nutritionalInfo?.ingredients, desc: 'Complete ingredients list' },
                    { key: 'includeAllergens', label: 'Allergen Warning', available: !!(nutritionalInfo?.allergens?.length), desc: 'Allergen information and warnings' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config[item.key as keyof DesignConfig] as boolean}
                          onChange={(e) => handleConfigChange(item.key as keyof DesignConfig, e.target.checked)}
                          disabled={!item.available}
                          className="w-4 h-4 text-primary"
                        />
                        <div>
                          <Label className={item.available ? '' : 'text-muted-foreground'}>
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Badge variant={item.available ? 'default' : 'secondary'}>
                        {item.available ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Available</>
                        ) : (
                          'Not Available'
                        )}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Template Management */}
            {selectedItem && (
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Save className="h-5 w-5 text-primary" />
                    </div>
                    Templates
                  </CardTitle>
                  <CardDescription>Save your configuration or load existing templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {templates.slice(0, 3).map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => loadTemplate(template.id)}
                        className="text-xs"
                      >
                        {template.name}
                      </Button>
                    ))}
                    {templates.length > 3 && (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs">
                            +{templates.length - 3} more
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>All Templates</SheetTitle>
                            <SheetDescription>Load or manage your saved templates</SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-2">
                            {templates.map((template) => (
                              <Button
                                key={template.id}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => loadTemplate(template.id)}
                              >
                                {template.name}
                              </Button>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>
                    )}
                  </div>

                  <Separator />
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Template name..."
                      value={templateConfig.name}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Template description (optional)..."
                      value={templateConfig.description}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                    <Button
                      onClick={saveTemplate}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!templateConfig.name.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  Live Preview
                  <Badge variant="outline" className="ml-auto">
                    <Smartphone className="w-3 h-3 mr-1" />
                    Mobile Ready
                  </Badge>
                </CardTitle>
                <CardDescription>Real-time preview of your professional label</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedItem ? (
                  <div className="space-y-4">
                    <FoodLabelPreview 
                      selectedItems={[selectedItem]}
                      selectedItemId={selectedItem.id}
                    />
                    
                    <div className="space-y-2">
                      <Button
                        onClick={generateHighQualityPDF}
                        disabled={isGenerating}
                        className="w-full"
                        size="lg"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Generating...' : 'Generate Premium Label'}
                      </Button>
                      
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          High-Quality PDF • 300 DPI • Thermal Optimized
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a product to see live preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};