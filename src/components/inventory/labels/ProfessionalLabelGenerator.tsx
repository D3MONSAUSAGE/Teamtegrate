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
  companyAddress: string;
  netWeight: string;
  logoData?: string;
  ingredients: string;
  servingSize: string;
  calories: string;
  totalFat: string;
  saturatedFat: string;
  transFat: string;
  cholesterol: string;
  sodium: string;
  totalCarbs: string;
  dietaryFiber: string;
  totalSugars: string;
  addedSugars: string;
  protein: string;
  vitaminD: string;
  calcium: string;
  iron: string;
  potassium: string;
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
    name: 'Professional Food Label',
    description: 'FDA-compliant nutrition facts, ingredients, allergens, and company info',
    fields: ['company', 'product', 'sku', 'barcode', 'lot', 'nutrition', 'ingredients', 'allergens', 'netweight', 'address']
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('food');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Company and lot code state
  const [companyName, setCompanyName] = useState('Your Company Name');
  const [companyAddress, setCompanyAddress] = useState('123 Main St, City, State 12345');
  const [netWeight, setNetWeight] = useState('1 lb (454g)');
  const [lotCode, setLotCode] = useState('');
  
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoData, setLogoData] = useState<string>('');
  const [logoUploadStatus, setLogoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Enhanced nutritional info state for FDA compliance
  const [ingredients, setIngredients] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [totalFat, setTotalFat] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [transFat, setTransFat] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [sodium, setSodium] = useState('');
  const [totalCarbs, setTotalCarbs] = useState('');
  const [dietaryFiber, setDietaryFiber] = useState('');
  const [totalSugars, setTotalSugars] = useState('');
  const [addedSugars, setAddedSugars] = useState('');
  const [protein, setProtein] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  const [calcium, setCalcium] = useState('');
  const [iron, setIron] = useState('');
  const [potassium, setPotassium] = useState('');
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

  // Handle item selection
  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItem(null);
      return;
    }

    const selectedItemFromList = items.find(i => i.id === selectedItemId) || null;
    
    if (selectedItemFromList?.id !== selectedItem?.id) {
      setSelectedItem(selectedItemFromList);
      
      if (selectedItemFromList) {
        const companyPrefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const lotNumber = BarcodeGenerator.generateLotNumber(companyPrefix || 'LOT');
        setLotCode(lotNumber);
      }
    }
  }, [selectedItemId, items, selectedItem?.id, companyName]);

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
    
    if (file.size > 2 * 1024 * 1024) {
      console.error('❌ File too large for thermal printer:', file.size);
      setLogoUploadStatus('error');
      toast.error('Image must be smaller than 2MB for thermal printing');
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      console.log('🖼️ Image dimensions:', { width: img.width, height: img.height });
      
      if (img.width > 812 || img.height > 1218) {
        console.warn('⚠️ Large image detected for thermal printer:', { width: img.width, height: img.height });
        toast.warning('Large image detected. Consider using smaller dimensions (max 812x1218px) for optimal thermal printing.');
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('✅ Logo processed for thermal printing:', { 
          dataUrlLength: result.length,
          hasData: !!result
        });
        
        setLogoData(result);
        setLogoPreview(result);
        setLogoFile(file);
        setLogoUploadStatus('success');
        toast.success('Logo uploaded and optimized for thermal printing!');
      };
      reader.onerror = () => {
        console.error('❌ FileReader error during logo processing');
        setLogoUploadStatus('error');
        toast.error('Failed to process logo for thermal printing');
      };
      reader.readAsDataURL(file);
    };
    
    img.onerror = () => {
      console.error('❌ Image loading error during logo processing');
      setLogoUploadStatus('error');
      toast.error('Invalid image file for thermal printing');
    };
    
    img.src = URL.createObjectURL(file);
  }, []);

  // Load saved templates from localStorage
  const loadSavedTemplates = useCallback(() => {
    try {
      const saved = localStorage.getItem('labelTemplates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved templates:', error);
    }
  }, []);

  // Input handlers
  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCompanyName(newValue);
  }, []);

  const handleItemSelect = useCallback((value: string) => {
    setSelectedItemId(value);
  }, []);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
  }, []);

  const handleIngredientsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIngredients(e.target.value);
  }, []);

  const handleServingSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setServingSize(e.target.value);
  }, []);

  const handleCaloriesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCalories(e.target.value);
  }, []);

  const handleTotalFatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalFat(e.target.value);
  }, []);

  const handleSodiumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSodium(e.target.value);
  }, []);

  const handleTotalCarbsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalCarbs(e.target.value);
  }, []);

  const handleProteinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProtein(e.target.value);
  }, []);

  const handleAllergensChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAllergens(e.target.value);
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
      companyAddress,
      netWeight,
      logoData,
      ingredients,
      servingSize,
      calories,
      totalFat,
      saturatedFat,
      transFat,
      cholesterol,
      sodium,
      totalCarbs,
      dietaryFiber,
      totalSugars,
      addedSugars,
      protein,
      vitaminD,
      calcium,
      iron,
      potassium,
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
  }, [templateName, companyName, companyAddress, netWeight, logoData, ingredients, servingSize, calories, totalFat, saturatedFat, transFat, cholesterol, sodium, totalCarbs, dietaryFiber, totalSugars, addedSugars, protein, vitaminD, calcium, iron, potassium, allergens, savedTemplates]);

  // Load a saved template
  const loadTemplate = useCallback((templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (template) {
      setCompanyName(template.companyName);
      setCompanyAddress(template.companyAddress || '123 Main St, City, State 12345');
      setNetWeight(template.netWeight || '1 lb (454g)');
      
      if (template.logoData) {
        setLogoData(template.logoData);
        setLogoPreview(template.logoData);
      } else {
        setLogoData('');
        setLogoPreview('');
        setLogoFile(null);
      }
      
      setIngredients(template.ingredients);
      setServingSize(template.servingSize);
      setCalories(template.calories);
      setTotalFat(template.totalFat);
      setSaturatedFat(template.saturatedFat || '');
      setTransFat(template.transFat || '');
      setCholesterol(template.cholesterol || '');
      setSodium(template.sodium);
      setTotalCarbs(template.totalCarbs);
      setDietaryFiber(template.dietaryFiber || '');
      setTotalSugars(template.totalSugars || '');
      setAddedSugars(template.addedSugars || '');
      setProtein(template.protein);
      setVitaminD(template.vitaminD || '');
      setCalcium(template.calcium || '');
      setIron(template.iron || '');
      setPotassium(template.potassium || '');
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

  // Calculate % Daily Value for nutrition facts
  const calculateDailyValue = (nutrient: string, value: string): string => {
    if (!value || value.trim() === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    const dailyValues: { [key: string]: number } = {
      totalFat: 65,
      saturatedFat: 20,
      cholesterol: 300,
      sodium: 2300,
      totalCarbs: 300,
      dietaryFiber: 25,
      vitaminD: 20,
      calcium: 1300,
      iron: 18,
      potassium: 4700
    };
    
    const dv = dailyValues[nutrient];
    if (!dv) return '';
    
    const percentage = Math.round((numValue / dv) * 100);
    return `${percentage}%`;
  };

  const generateLabel = async () => {
    if (!selectedItem) {
      toast.error('Please select a product first');
      return;
    }

    const template = LABEL_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    console.log('[PDF_GEN] Starting PDF generation with:', {
      item: selectedItem.name,
      template: template.name,
      hasLogo: !!logoData,
      logoDataType: typeof logoData,
      logoLength: logoData?.length || 0,
      logoPreview: logoPreview?.substring(0, 50) + '...'
    });

    setIsGenerating(true);

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6] // 4x6 inch thermal label
      });

      console.log('[PDF_GEN] PDF document created, starting content generation');
      pdf.setFont('helvetica');
      let y = 0.2;

      // Logo and Company Header
      if (logoData) {
        try {
          console.log('[PDF_LOGO] Attempting to add logo to PDF');
          
          // Ensure logo data is in correct format
          let imageData = logoData;
          if (!logoData.startsWith('data:')) {
            imageData = `data:image/png;base64,${logoData}`;
          }
          
          const logoSize = 0.6;
          const logoX = 0.3;
          const logoY = y;
          
          // Add logo with better error handling
          pdf.addImage(imageData, 'PNG', logoX, logoY, logoSize, logoSize);
          console.log('[PDF_LOGO] Logo added successfully');
          
          // Company name next to logo
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(companyName.toUpperCase(), logoX + logoSize + 0.1, logoY + 0.35);
          y += logoSize + 0.2;
        } catch (error) {
          console.error('[PDF_LOGO] Failed to add logo to PDF:', error);
          console.log('[PDF_LOGO] Logo data type:', typeof logoData);
          console.log('[PDF_LOGO] Logo data length:', logoData?.length || 0);
          
          // Fallback: Just company name
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(companyName.toUpperCase(), 2, y + 0.2, { align: 'center' });
          y += 0.4;
        }
      } else if (companyName) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(companyName.toUpperCase(), 2, y + 0.2, { align: 'center' });
        y += 0.4;
      }

      // Divider line
      pdf.setLineWidth(0.01);
      pdf.line(0.2, y, 3.8, y);
      y += 0.15;

      // Product Name (larger, centered)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedItem.name, 2, y, { align: 'center' });
      y += 0.3;

      // Net Weight (centered, if specified)
      if (template.fields.includes('netweight') && netWeight.trim()) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Net Weight: ${netWeight}`, 2, y, { align: 'center' });
        y += 0.25;
      }

      // SKU and Date (left/right aligned)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`SKU: ${selectedItem.sku || 'N/A'}`, 0.2, y);
      
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`DATE: ${currentDate}`, 3.8, y, { align: 'right' });
      y += 0.2;

      // LOT Code (if included)
      if (template.fields.includes('lot') && lotCode) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`LOT: ${lotCode}`, 0.2, y);
        y += 0.25;
      }

      // Barcode (centered)
      try {
        const barcodeValue = selectedItem.barcode || selectedItem.sku || lotCode;
        const barcodeImage = BarcodeGenerator.generateBarcode(barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 35,
          displayValue: true,
          background: '#ffffff',
          lineColor: '#000000'
        });
        
        if (barcodeImage) {
          pdf.addImage(barcodeImage, 'PNG', 0.5, y, 3, 0.5);
          y += 0.7;
        }
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }

      // FDA-Compliant Nutrition Facts Table - Optimized Two-Column Layout
      if (template.fields.includes('nutrition') && (servingSize || calories)) {
        console.log('[PDF_NUTRITION] Starting compact two-column nutrition facts table generation');
        
        // Nutrition Facts header
        pdf.setFontSize(12); // Slightly smaller
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nutrition Facts', 0.2, y + 0.1);
        y += 0.2; // Reduced spacing

        // Main nutrition facts box with borders
        const boxWidth = 3.6;
        const boxStartY = y;
        const leftColX = 0.3;
        const rightColX = 2.1; // Split at ~55%
        const rightColWidth = 1.5;
        
        pdf.setLineWidth(0.02);
        
        // Serving size section (compact)
        if (servingSize) {
          pdf.setFontSize(8); // Smaller text
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Serving: ${servingSize}`, leftColX, y + 0.1);
          y += 0.15; // Reduced spacing
          
          // Line under serving size
          pdf.setLineWidth(0.01);
          pdf.line(0.2, y, 3.8, y);
          y += 0.06;
        }

        // Calories (compact)
        if (calories) {
          pdf.setFontSize(12); // Smaller than before
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Calories ${calories}`, leftColX, y + 0.12);
          y += 0.2; // Reduced spacing
          
          // Thick line under calories
          pdf.setLineWidth(0.03);
          pdf.line(0.2, y, 3.8, y);
          y += 0.08;
        }

        // % Daily Value header
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text('% DV*', 3.5, y + 0.06, { align: 'right' });
        y += 0.1;

        // Main nutrients for left column
        const mainNutrients = [
          { label: 'Total Fat', value: totalFat, unit: 'g', dvKey: 'totalFat' },
          { label: 'Sat. Fat', value: saturatedFat, unit: 'g', dvKey: 'saturatedFat', indent: true },
          { label: 'Sodium', value: sodium, unit: 'mg', dvKey: 'sodium' },
          { label: 'Total Carbs', value: totalCarbs, unit: 'g', dvKey: 'totalCarbs' },
          { label: 'Fiber', value: dietaryFiber, unit: 'g', dvKey: 'dietaryFiber', indent: true },
          { label: 'Protein', value: protein, unit: 'g' }
        ];

        // Vitamins/minerals for right column
        const vitaminsData = [
          { label: 'Vitamin D', value: vitaminD, unit: 'mcg', dvKey: 'vitaminD' },
          { label: 'Calcium', value: calcium, unit: 'mg', dvKey: 'calcium' },
          { label: 'Iron', value: iron, unit: 'mg', dvKey: 'iron' },
          { label: 'Potassium', value: potassium, unit: 'mg', dvKey: 'potassium' }
        ];

        // Start Y positions for both columns
        const columnStartY = y;
        let leftY = columnStartY;
        let rightY = columnStartY;

        // Render main nutrients (left column)
        pdf.setFontSize(6); // Smaller for compact layout
        mainNutrients.forEach(item => {
          if (item.value && item.value.trim()) {
            const xPos = item.indent ? leftColX + 0.1 : leftColX;
            pdf.setFont('helvetica', 'normal');
            
            const text = `${item.label} ${item.value}${item.unit}`;
            pdf.text(text, xPos, leftY + 0.07);
            
            if (item.dvKey) {
              const dv = calculateDailyValue(item.dvKey, item.value);
              if (dv) {
                pdf.setFont('helvetica', 'bold');
                pdf.text(dv, rightColX - 0.1, leftY + 0.07, { align: 'right' });
              }
            }
            
            leftY += 0.1; // Compact spacing
            
            // Add subtle lines after major items
            if (['Total Fat', 'Sodium', 'Total Carbs'].includes(item.label)) {
              pdf.setLineWidth(0.005);
              pdf.line(leftColX, leftY, rightColX - 0.15, leftY);
              leftY += 0.03;
            }
          }
        });

        // Render vitamins/minerals (right column)
        const hasVitamins = vitaminsData.some(v => v.value && v.value.trim());
        if (hasVitamins) {
          // Column header
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6);
          pdf.text('Vitamins & Minerals', rightColX, rightY + 0.07);
          rightY += 0.12;
          
          pdf.setFont('helvetica', 'normal');
          vitaminsData.forEach(vitamin => {
            if (vitamin.value && vitamin.value.trim()) {
              const text = `${vitamin.label} ${vitamin.value}${vitamin.unit}`;
              pdf.text(text, rightColX, rightY + 0.07);
              
              const dv = calculateDailyValue(vitamin.dvKey, vitamin.value);
              if (dv) {
                pdf.setFont('helvetica', 'bold');
                pdf.text(dv, 3.7, rightY + 0.07, { align: 'right' });
                pdf.setFont('helvetica', 'normal');
              }
              rightY += 0.1;
            }
          });
        }

        // Use the maximum Y position from both columns
        y = Math.max(leftY, rightY) + 0.08;

        // Calculate box height and draw outer border
        const boxHeight = y - boxStartY + 0.03;
        pdf.setLineWidth(0.02);
        pdf.rect(0.2, boxStartY, boxWidth, boxHeight);
        
        // Vertical divider between columns (optional)
        pdf.setLineWidth(0.005);
        pdf.line(rightColX - 0.05, columnStartY, rightColX - 0.05, y - 0.05);

        // Daily value footnote (compact)
        y += 0.03;
        pdf.setFontSize(5);
        pdf.setFont('helvetica', 'normal');
        pdf.text('*% Daily Value based on 2000 calorie diet', leftColX, y + 0.06);
        y += 0.12;
        
        console.log('[PDF_NUTRITION] Compact two-column nutrition facts table completed');
      }

      // Ingredients (if included)
      if (template.fields.includes('ingredients') && ingredients.trim()) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INGREDIENTS:', 0.2, y);
        y += 0.12;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const ingredientLines = pdf.splitTextToSize(ingredients, 3.6);
        pdf.text(ingredientLines, 0.2, y);
        y += (ingredientLines.length * 0.09) + 0.1;
      }

      // Allergens (if included)
      if (template.fields.includes('allergens') && allergens.trim()) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CONTAINS:', 0.2, y);
        y += 0.12;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(allergens.toUpperCase(), 0.2, y);
        y += 0.15;
      }

      // Company footer with address (if included)
      if (template.fields.includes('address') && companyAddress.trim()) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Distributed by: ${companyName}`, 2, 5.7, { align: 'center' });
        pdf.text(companyAddress, 2, 5.85, { align: 'center' });
      } else {
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated by ${companyName} - ${new Date().toLocaleDateString()}`, 2, 5.85, { align: 'center' });
      }

      // Save PDF
      const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${selectedItem.name.replace(/[^a-zA-Z0-9]/g, '-')}-${template.id}.pdf`;
      pdf.save(filename);
      
      toast.success('Professional FDA-compliant label generated successfully!');
      
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const LabelForm = () => (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-center gap-2 text-green-700">
          <Utensils className="h-5 w-5" />
          <span className="font-medium">FDA-Compliant Food Label Generator Ready!</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Now supports professional nutrition facts tables, company addresses, and thermal printer optimization.
        </p>
      </div>

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
                      {template.fields.includes('nutrition') && <Badge variant="outline" className="text-xs">FDA Nutrition</Badge>}
                      {template.fields.includes('ingredients') && <Badge variant="outline" className="text-xs">Ingredients</Badge>}
                      {template.fields.includes('allergens') && <Badge variant="outline" className="text-xs">Allergens</Badge>}
                      {template.fields.includes('netweight') && <Badge variant="outline" className="text-xs">Net Weight</Badge>}
                      <Badge variant="outline" className="text-xs">Barcode</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Information */}
      {selectedItem && (
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
                  placeholder="Enter company name"
                  className="mt-1"
                />
              </div>
              
              {templateFields.includes('address') && (
                <div>
                  <Label htmlFor="company-address" className="text-sm font-medium">Company Address</Label>
                  <Input
                    id="company-address"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                    className="mt-1"
                  />
                </div>
              )}
              
              {templateFields.includes('netweight') && (
                <div>
                  <Label htmlFor="net-weight" className="text-sm font-medium">Net Weight</Label>
                  <Input
                    id="net-weight"
                    value={netWeight}
                    onChange={(e) => setNetWeight(e.target.value)}
                    placeholder="1 lb (454g)"
                    className="mt-1"
                  />
                </div>
              )}
              
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
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          onLogoDrop(Array.from(files));
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
                             logoUploadStatus === 'error' ? 'Upload failed - try again' :
                             'Click to upload logo'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG or JPG under 2MB recommended for thermal printers
                          </p>
                        </div>
                      </div>
                    </label>
                    
                    {logoPreview && logoUploadStatus === 'success' && (
                      <div className="mt-4 p-4 bg-muted/30 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Thermal Print Preview</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogoPreview('');
                              setLogoData('');
                              setLogoFile(null);
                              setLogoUploadStatus('idle');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="max-h-20 mx-auto rounded border bg-white p-2"
                          style={{ filter: 'grayscale(100%) contrast(120%)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutritional Information & Ingredients */}
      {selectedItem && showNutritionalFields && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="h-5 w-5 text-primary" />
              FDA-Compliant Nutrition & Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Ingredients */}
              {templateFields.includes('ingredients') && (
                <div>
                  <Label htmlFor="ingredients" className="text-sm font-medium">Ingredients List</Label>
                  <Textarea
                    id="ingredients"
                    value={ingredients}
                    onChange={handleIngredientsChange}
                    placeholder="List ingredients in descending order by weight (e.g., Water, Sugar, Salt...)"
                    className="mt-1 h-20"
                  />
                </div>
              )}

              {/* Allergens */}
              {templateFields.includes('allergens') && (
                <div>
                  <Label htmlFor="allergens" className="text-sm font-medium">Allergen Information</Label>
                  <Input
                    id="allergens"
                    value={allergens}
                    onChange={handleAllergensChange}
                    placeholder="e.g., Milk, Eggs, Peanuts, Tree Nuts"
                    className="mt-1"
                  />
                </div>
              )}

              {/* FDA Nutrition Facts */}
              {templateFields.includes('nutrition') && (
                <div>
                  <Label className="text-sm font-medium">FDA-Compliant Nutrition Facts</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
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
                      <Label htmlFor="saturated-fat" className="text-sm">Saturated Fat (g)</Label>
                      <Input
                        id="saturated-fat"
                        value={saturatedFat}
                        onChange={(e) => setSaturatedFat(e.target.value)}
                        placeholder="2"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trans-fat" className="text-sm">Trans Fat (g)</Label>
                      <Input
                        id="trans-fat"
                        value={transFat}
                        onChange={(e) => setTransFat(e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cholesterol" className="text-sm">Cholesterol (mg)</Label>
                      <Input
                        id="cholesterol"
                        value={cholesterol}
                        onChange={(e) => setCholesterol(e.target.value)}
                        placeholder="10"
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
                      <Label htmlFor="dietary-fiber" className="text-sm">Dietary Fiber (g)</Label>
                      <Input
                        id="dietary-fiber"
                        value={dietaryFiber}
                        onChange={(e) => setDietaryFiber(e.target.value)}
                        placeholder="3"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="total-sugars" className="text-sm">Total Sugars (g)</Label>
                      <Input
                        id="total-sugars"
                        value={totalSugars}
                        onChange={(e) => setTotalSugars(e.target.value)}
                        placeholder="12"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="added-sugars" className="text-sm">Added Sugars (g)</Label>
                      <Input
                        id="added-sugars"
                        value={addedSugars}
                        onChange={(e) => setAddedSugars(e.target.value)}
                        placeholder="5"
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
                    <div>
                      <Label htmlFor="vitamin-d" className="text-sm">Vitamin D (mcg)</Label>
                      <Input
                        id="vitamin-d"
                        value={vitaminD}
                        onChange={(e) => setVitaminD(e.target.value)}
                        placeholder="2"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calcium" className="text-sm">Calcium (mg)</Label>
                      <Input
                        id="calcium"
                        value={calcium}
                        onChange={(e) => setCalcium(e.target.value)}
                        placeholder="100"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="iron" className="text-sm">Iron (mg)</Label>
                      <Input
                        id="iron"
                        value={iron}
                        onChange={(e) => setIron(e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="potassium" className="text-sm">Potassium (mg)</Label>
                      <Input
                        id="potassium"
                        value={potassium}
                        onChange={(e) => setPotassium(e.target.value)}
                        placeholder="300"
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
          {isGenerating ? 'Generating...' : 'Generate Professional FDA-Compliant Label'}
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
          Generate FDA-compliant food labels with nutrition facts, company branding, and thermal printer optimization
        </p>
      </div>

      {/* Mobile: Use Drawer, Desktop: Regular Layout */}
      {isMobile ? (
        <div className="p-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="w-full py-6 text-lg">
                <Barcode className="mr-2 h-5 w-5" />
                Create Professional Label
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Generate FDA-Compliant Label</DrawerTitle>
                <DrawerDescription>
                  Configure your professional food label with nutrition facts
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