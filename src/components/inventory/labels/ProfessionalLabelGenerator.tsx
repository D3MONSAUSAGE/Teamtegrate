import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { InventoryItem } from '@/contexts/inventory/types';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Barcode, FileText, Download, Building2, Hash, Calendar, Utensils, Save, FolderOpen, Trash2, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { convertFlatToSimple } from '../SimpleNutritionalForm';
import jsPDF from 'jspdf';
import { useDropzone } from 'react-dropzone';

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
}

interface SavedTemplate {
  id: string;
  name: string;
  companyName: string;
  logoData?: string; // Base64 encoded logo image
  ingredients: string;
  servingSize: string;
  calories: string;
  totalFat: string;
  sodium: string;
  totalCarbs: string;
  protein: string;
  allergens: string;
  createdAt: string;
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

const ProfessionalLabelGenerator: React.FC = () => {
  const inventoryContext = useEnhancedInventoryManagement();
  const { user } = useAuth();
  
  const items = inventoryContext.items || [];

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Company and lot code state
  const [companyName, setCompanyName] = useState('Your Company Name');
  const [lotCode, setLotCode] = useState('');
  
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoData, setLogoData] = useState<string>(''); // Base64 for PDF

  // Simple nutritional info state
  const [ingredients, setIngredients] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [totalFat, setTotalFat] = useState('');
  const [sodium, setSodium] = useState('');
  const [totalCarbs, setTotalCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [allergens, setAllergens] = useState('');

  // Template management state
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [selectedSavedTemplate, setSelectedSavedTemplate] = useState<string>('');

  // Cache current template to prevent re-renders during typing
  const currentTemplate = useMemo(() => 
    LABEL_TEMPLATES.find(t => t.id === selectedTemplate), 
    [selectedTemplate]
  );

  const templateFields = useMemo(() => 
    currentTemplate?.fields || [], 
    [currentTemplate]
  );

  const showNutritionalFields = useMemo(() => 
    templateFields.some(f => ['nutrition', 'ingredients', 'allergens'].includes(f)), 
    [templateFields]
  );


  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved templates on mount
  useEffect(() => {
    loadSavedTemplates();
  }, []);

  // Handle item selection - stabilized to prevent re-renders during typing
  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItem(null);
      return;
    }

    const selectedItemFromList = items.find(i => i.id === selectedItemId) || null;
    
    if (selectedItemFromList?.id !== selectedItem?.id) {
      setSelectedItem(selectedItemFromList);
      
      // Generate lot code only when item changes
      if (selectedItemFromList) {
        const companyPrefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const lotNumber = BarcodeGenerator.generateLotNumber(companyPrefix || 'LOT');
        setLotCode(lotNumber);
      }
    }
  }, [selectedItemId, items, selectedItem?.id]);

  // Enhanced state for thermal printer logo upload
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploadStatus, setLogoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // Logo upload handling optimized for thermal printing
  const onLogoDrop = useCallback((acceptedFiles: File[]) => {
    console.log('🔍 Logo upload started - Files received:', acceptedFiles.length);
    setLogoUploadStatus('uploading');
    
    if (acceptedFiles.length === 0) {
      console.log('❌ No files selected');
      setLogoUploadStatus('error');
      toast.error('No files selected');
      return;
    }

    const file = acceptedFiles[0];
    console.log('📁 Processing file:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });
    
    // Thermal printer optimized validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      console.error('❌ Invalid file type for thermal printer:', file.type);
      setLogoUploadStatus('error');
      toast.error('For thermal printers, please use PNG or JPG files only');
      return;
    }
    
    // Reduced size limit for thermal printers (2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('❌ File too large for thermal printer:', file.size);
      setLogoUploadStatus('error');
      toast.error('Image must be smaller than 2MB for thermal printing');
      return;
    }
    
    // Check image dimensions for thermal printer optimization
    const img = new Image();
    img.onload = () => {
      console.log('🖼️ Image dimensions:', { width: img.width, height: img.height });
      
      // For 4x6 thermal at 203 DPI: max recommended 812x1218 pixels
      if (img.width > 812 || img.height > 1218) {
        console.warn('⚠️ Image large for thermal printer:', { width: img.width, height: img.height });
        toast.warning('Image is large - may affect thermal print quality');
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('✅ Logo processed successfully');
        setLogoUrl(result);
        setLogoData(result);
        setLogoPreview(result);
        setLogoUploadStatus('success');
        toast.success('Logo uploaded - optimized for thermal printing!');
      };
      
      reader.onerror = (e) => {
        console.error('❌ FileReader error:', e);
        setLogoUploadStatus('error');
        toast.error('Failed to process image file');
      };
      
      reader.readAsDataURL(file);
    };
    
    img.onerror = () => {
      console.error('❌ Failed to load image for validation');
      setLogoUploadStatus('error');
      toast.error('Invalid image file');
    };
    
    const tempUrl = URL.createObjectURL(file);
    img.src = tempUrl;
  }, []);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onLogoDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg']
    },
    multiple: false,
    noClick: false,
    noKeyboard: false
  });

  const removeLogo = useCallback(() => {
    console.log('Removing logo');
    setLogoFile(null);
    setLogoPreview('');
    setLogoData('');
    toast.success('Logo removed');
  }, []);

  // Load nutritional data only when item ID changes
  useEffect(() => {
    if (!selectedItem?.id) {
      // Clear all data when no item selected
      setIngredients('');
      setServingSize('');
      setCalories('');
      setTotalFat('');
      setSodium('');
      setTotalCarbs('');
      setProtein('');
      setAllergens('');
      return;
    }

    const loadNutritionalData = async () => {
      try {
        const nutritionalInfo = await nutritionalInfoApi.getByItemId(selectedItem.id);
        if (nutritionalInfo) {
          const simpleData = convertFlatToSimple(nutritionalInfo);
          setIngredients(simpleData.ingredients);
          setServingSize(simpleData.servingSize);
          setCalories(simpleData.calories);
          setTotalFat(simpleData.totalFat);
          setSodium(simpleData.sodium);
          setTotalCarbs(simpleData.totalCarbs);
          setProtein(simpleData.protein);
          setAllergens(simpleData.allergens);
        }
      } catch (error) {
        console.log('No nutritional data found for pre-population');
      }
    };
    
    loadNutritionalData();
  }, [selectedItem?.id]);

  // Load saved templates from localStorage
  const loadSavedTemplates = () => {
    try {
      const saved = localStorage.getItem('labelTemplates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Stabilized event handlers
  const handleTemplateSelect = useCallback((templateId: string) => {
    console.log('Template selected:', templateId);
    setSelectedTemplate(templateId);
  }, []);

  const handleItemSelect = useCallback((itemId: string) => {
    console.log('Item selected:', itemId);
    setSelectedItemId(itemId);
  }, []);

  // Enhanced input change handlers with comprehensive debugging
  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Company Name Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setCompanyName(newValue);
    console.log('✅ Company name state updated to:', newValue);
  }, []);

  const handleIngredientsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Ingredients Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setIngredients(newValue);
    console.log('✅ Ingredients state updated to:', newValue);
  }, []);

  const handleServingSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Serving Size Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setServingSize(newValue);
    console.log('✅ Serving size state updated to:', newValue);
  }, []);

  const handleCaloriesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Calories Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setCalories(newValue);
    console.log('✅ Calories state updated to:', newValue);
  }, []);

  const handleTotalFatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Total Fat Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setTotalFat(newValue);
    console.log('✅ Total fat state updated to:', newValue);
  }, []);

  const handleSodiumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Sodium Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setSodium(newValue);
    console.log('✅ Sodium state updated to:', newValue);
  }, []);

  const handleTotalCarbsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Total Carbs Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setTotalCarbs(newValue);
    console.log('✅ Total carbs state updated to:', newValue);
  }, []);

  const handleProteinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Protein Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setProtein(newValue);
    console.log('✅ Protein state updated to:', newValue);
  }, []);

  const handleAllergensChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    console.log('📝 Allergens Input:', { 
      value: newValue, 
      focused: document.activeElement === e.target,
      timestamp: new Date().toISOString(),
      eventType: e.type
    });
    setAllergens(newValue);
    console.log('✅ Allergens state updated to:', newValue);
  }, []);

  // Save template to localStorage
  const saveTemplate = useCallback(() => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      companyName,
      logoData, // Include logo data
      ingredients,
      servingSize,
      calories,
      totalFat,
      sodium,
      totalCarbs,
      protein,
      allergens,
      createdAt: new Date().toISOString()
    };

    try {
      const updatedTemplates = [...savedTemplates, newTemplate];
      localStorage.setItem('labelTemplates', JSON.stringify(updatedTemplates));
      setSavedTemplates(updatedTemplates);
      setTemplateName('');
      toast.success(`Template "${newTemplate.name}" saved successfully!`);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  }, [templateName, companyName, logoData, ingredients, servingSize, calories, totalFat, sodium, totalCarbs, protein, allergens, savedTemplates]);

  // Load a saved template
  const loadTemplate = useCallback((templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (template) {
      setCompanyName(template.companyName);
      
      // Load logo data if available
      if (template.logoData) {
        setLogoData(template.logoData);
        setLogoPreview(template.logoData);
        // Don't set logoFile as it's not needed for display/PDF generation
      } else {
        setLogoData('');
        setLogoPreview('');
        setLogoFile(null);
      }
      
      setIngredients(template.ingredients);
      setServingSize(template.servingSize);
      setCalories(template.calories);
      setTotalFat(template.totalFat);
      setSodium(template.sodium);
      setTotalCarbs(template.totalCarbs);
      setProtein(template.protein);
      setAllergens(template.allergens);
      toast.success(`Template "${template.name}" loaded!`);
    }
  }, [savedTemplates]);

  // Delete a saved template
  const deleteTemplate = useCallback((templateId: string) => {
    try {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      localStorage.setItem('labelTemplates', JSON.stringify(updatedTemplates));
      setSavedTemplates(updatedTemplates);
      setSelectedSavedTemplate('');
      toast.success('Template deleted successfully!');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  }, [savedTemplates]);

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

      // Logo (if present) - at the very top
      if (logoData) {
        try {
          // Add logo centered at the top
          const logoSize = 0.8; // Logo height in inches
          pdf.addImage(logoData, 'PNG', 2 - (logoSize / 2), y, logoSize, logoSize);
          y += logoSize + 0.1; // Add space after logo
        } catch (error) {
          console.error('Failed to add logo to PDF:', error);
        }
      }

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
      if (template.fields.includes('nutrition') && (servingSize || calories || totalFat || sodium || totalCarbs || protein)) {
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
          { label: 'Serving Size', value: servingSize },
          { label: 'Calories', value: calories, bold: true },
          { label: 'Total Fat', value: totalFat, unit: 'g' },
          { label: 'Sodium', value: sodium, unit: 'mg' },
          { label: 'Total Carbs', value: totalCarbs, unit: 'g' },
          { label: 'Protein', value: protein, unit: 'g' },
        ];

        nutritionItems.forEach(item => {
          if (item.value && item.value.trim()) {
            pdf.setFont('helvetica', item.bold ? 'bold' : 'normal');
            const text = `${item.label}: ${item.value}${item.unit || ''}`;
            pdf.text(text, 0.3, y);
            y += 0.12;
          }
        });
        
        y += 0.15;
      }

      // Ingredients (if included)
      if (template.fields.includes('ingredients') && ingredients.trim()) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INGREDIENTS:', 0.2, y);
        y += 0.15;
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const ingredientLines = pdf.splitTextToSize(ingredients, 3.6);
        pdf.text(ingredientLines, 0.2, y);
        y += (ingredientLines.length * 0.08) + 0.1;
      }

      // Allergens (if included)
      if (template.fields.includes('allergens') && allergens.trim()) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CONTAINS:', 0.2, y);
        y += 0.15;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(allergens.toUpperCase(), 0.2, y);
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={handleCompanyNameChange}
                onFocus={(e) => console.log('🎯 Company name field focused:', e.target.value)}
                onBlur={(e) => console.log('👋 Company name field blurred:', e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🖱️ Company name field clicked');
                }}
                placeholder="Enter company name"
                className="mt-1"
                autoComplete="off"
              />
            </div>
            
            {/* Logo Upload Section */}
            <div>
              <Label className="text-sm font-medium">Company Logo (Thermal Printer Optimized)</Label>
              <div className="mt-2">
                <div className={`text-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                  logoUploadStatus === 'uploading' ? 'border-primary bg-primary/5' :
                  logoUploadStatus === 'success' ? 'border-green-500 bg-green-500/5' :
                  logoUploadStatus === 'error' ? 'border-red-500 bg-red-500/5' :
                  'border-border hover:border-primary/50'
                }`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      console.log('🎯 File input triggered');
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        console.log('📁 Files selected:', files.length);
                        onLogoDrop(Array.from(files));
                      } else {
                        console.log('❌ No files in input');
                      }
                    }}
                    className="hidden"
                    id="thermal-logo-upload"
                    disabled={logoUploadStatus === 'uploading'}
                  />
                  <label htmlFor="thermal-logo-upload" className={`cursor-pointer ${logoUploadStatus === 'uploading' ? 'pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center gap-3">
                      {logoUploadStatus === 'uploading' ? (
                        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <ImageIcon className={`h-10 w-10 ${
                          logoUploadStatus === 'success' ? 'text-green-600' :
                          logoUploadStatus === 'error' ? 'text-red-600' :
                          'text-muted-foreground'
                        }`} />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {logoUploadStatus === 'uploading' ? 'Processing for thermal printer...' :
                           logoUploadStatus === 'success' ? 'Logo ready for thermal printing!' :
                           logoUploadStatus === 'error' ? 'Upload failed - please try again' :
                           'Upload logo for 4×6 thermal labels'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG or JPG • Max 2MB • Best: 812×1218px or smaller
                        </p>
                        {logoUploadStatus === 'success' && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            ✓ Optimized and ready for thermal printing
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
                
                {logoUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative">
                      <img 
                        src={logoUrl} 
                        alt="Thermal printer logo preview" 
                        className="max-w-24 max-h-24 object-contain border rounded shadow-sm bg-white"
                      />
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Thermal Ready
                      </div>
                      <Button
                        onClick={() => {
                          setLogoUrl('');
                          setLogoData('');
                          setLogoPreview('');
                          setLogoFile(null);
                          setLogoUploadStatus('idle');
                          toast.success('Logo removed');
                        }}
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -left-2 h-6 w-6 rounded-full p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Logo appears at the top of thermal labels. Smaller images print better on thermal printers.
              </p>
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
          <Select value={selectedItemId} onValueChange={handleItemSelect}>
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
                  className={`p-4 border rounded-lg transition-all ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleTemplateSelect(template.id)}
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

      {/* Template Management */}
      {selectedItem && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
              Label Templates
            </CardTitle>
            <CardDescription>
              Save and reuse label configurations for faster generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Load Template */}
              {savedTemplates.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Load Saved Template</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={selectedSavedTemplate} onValueChange={setSelectedSavedTemplate}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(template.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => loadTemplate(selectedSavedTemplate)}
                      disabled={!selectedSavedTemplate}
                      variant="outline"
                      size="sm"
                    >
                      Load
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={!selectedSavedTemplate}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this template? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTemplate(selectedSavedTemplate)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {/* Save Template */}
              <div>
                <Label className="text-sm font-medium">Save Current Configuration</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name (e.g., 'Organic Products')"
                    className="flex-1"
                  />
                  <Button
                    onClick={saveTemplate}
                    disabled={!templateName.trim() || !companyName.trim()}
                    variant="outline"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Save your current settings to quickly generate similar labels in the future
                </p>
              </div>

              {/* Template List */}
              {savedTemplates.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-2">
                    {savedTemplates.length} template{savedTemplates.length !== 1 ? 's' : ''} saved
                  </div>
                  <div className="grid gap-2">
                    {savedTemplates.slice(0, 3).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded border text-sm"
                      >
                        <div>
                          <span className="font-medium">{template.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ({template.companyName})
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => loadTemplate(template.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutritional Information Form */}
      {selectedItem && showNutritionalFields && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="h-5 w-5 text-primary" />
              Nutritional Information
            </CardTitle>
            <CardDescription>
              Enter nutritional information and ingredients for your label
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Ingredients */}
              {templateFields.includes('ingredients') && (
                <div>
                  <Label htmlFor="ingredients" className="text-sm font-medium">Ingredients</Label>
                    <Textarea
                      id="ingredients"
                      value={ingredients}
                      onChange={handleIngredientsChange}
                      placeholder="Enter ingredients list (e.g., Water, Sugar, Salt...)"
                      className="mt-1 min-h-[80px]"
                    />
                </div>
              )}

              {/* Allergens */}
              {templateFields.includes('allergens') && (
                <div>
                  <Label htmlFor="allergens" className="text-sm font-medium">Allergens</Label>
                      <Input
                        id="allergens"
                        value={allergens}
                        onChange={handleAllergensChange}
                        placeholder="Contains: Milk, Eggs, Wheat..."
                        className="mt-1"
                      />
                </div>
              )}

              {/* Nutrition Facts */}
              {templateFields.includes('nutrition') && (
                <div className="space-y-3">
                  <div className="font-medium text-sm">Nutrition Facts</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="serving-size" className="text-sm">Serving Size</Label>
                        <Input
                          id="serving-size"
                          value={servingSize}
                          onChange={handleServingSizeChange}
                          placeholder="1 cup (240ml)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="calories" className="text-sm">Calories</Label>
                        <Input
                          id="calories"
                          value={calories}
                          onChange={handleCaloriesChange}
                          placeholder="150"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="total-fat" className="text-sm">Total Fat (g)</Label>
                        <Input
                          id="total-fat"
                          value={totalFat}
                          onChange={handleTotalFatChange}
                          placeholder="5"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sodium" className="text-sm">Sodium (mg)</Label>
                        <Input
                          id="sodium"
                          value={sodium}
                          onChange={handleSodiumChange}
                          placeholder="200"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="total-carbs" className="text-sm">Total Carbs (g)</Label>
                        <Input
                          id="total-carbs"
                          value={totalCarbs}
                          onChange={handleTotalCarbsChange}
                          placeholder="30"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="protein" className="text-sm">Protein (g)</Label>
                        <Input
                          id="protein"
                          value={protein}
                          onChange={handleProteinChange}
                          placeholder="8"
                          className="mt-1"
                        />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
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

export { ProfessionalLabelGenerator };