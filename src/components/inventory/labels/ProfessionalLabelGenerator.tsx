import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInventory } from '@/contexts/inventory';
import { InventoryItem } from '@/contexts/inventory/types';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { UnifiedTeamSelector } from '@/components/teams/UnifiedTeamSelector';
import { Package, Barcode, FileText, Download, Building2, Hash, Calendar, Utensils, Save, FolderOpen, Trash2, ImageIcon, X, Edit, Loader2, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { convertFlatToSimple } from '../SimpleNutritionalForm';
import { LabelPreview } from './LabelPreview';
import { useLabelGeneration } from '@/hooks/useLabelGeneration';
import { useLabelTemplates, SavedTemplate as DBSavedTemplate } from '@/hooks/useLabelTemplates';
import { useLabelDraftPersistence } from '@/hooks/useLabelDraftPersistence';
import jsPDF from 'jspdf';

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
}

type SavedTemplate = DBSavedTemplate;

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

interface BatchData {
  batchId: string;
  batchNumber: string;
  itemId?: string;
  lotId?: string;
  lotNumber?: string;
  itemName?: string;
  maxQuantity?: number;
}

interface ProfessionalLabelGeneratorProps {
  preSelectedItemId?: string;
  batchData?: BatchData;
  inModal?: boolean;
  selectedTeamId?: string | null;
}

const ProfessionalLabelGenerator: React.FC<ProfessionalLabelGeneratorProps> = ({ 
  preSelectedItemId, 
  batchData,
  inModal = false,
  selectedTeamId: propSelectedTeamId
}) => {
  // Helper function to convert image URL to base64 for PDF generation
  const convertUrlToBase64 = async (url: string): Promise<string> => {
    try {
      console.log('[PDF_LOGO] Converting URL to base64:', url);
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('[PDF_LOGO] URL conversion successful');
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[PDF_LOGO] Failed to convert URL to base64:', error);
      throw error;
    }
  };

  const location = useLocation();
  const { items, loading: inventoryLoading } = useInventory();
  const { user } = useAuth();
  const { availableTeams } = useTeamAccess();
  const { recordLabelGeneration, saving: savingLabelToDb } = useLabelGeneration();
  
  // Use the team selection from parent (page-level selector) or fall back to first available team
  const selectedTeamId = propSelectedTeamId || (availableTeams.length > 0 ? availableTeams[0].id : null);
  const { 
    templates: savedTemplates, 
    loading: templatesLoading,
    saveTemplate: saveTemplateToDb,
    updateTemplate: updateTemplateInDb,
    deleteTemplate: deleteTemplateFromDb
  } = useLabelTemplates();

  // Draft persistence - skip if we have batch or pre-selected data (those take precedence)
  const shouldUseDraft = !batchData && !preSelectedItemId;
  const { draftData, isLoading: draftLoading, lastSaved, updateDraft, clearDraft } = useLabelDraftPersistence('label-generator');
  
  // Track if draft has been restored to prevent toast spam
  const hasRestoredDraft = useRef(false);
  
  const [isMobile, setIsMobile] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preSelectedItemId || batchData?.itemId || ''
  );
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('food');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [quantityToPrint, setQuantityToPrint] = useState<number>(1);

  // Company and lot code state
  const [companyName, setCompanyName] = useState('Your Company Name');
  const [companyAddress, setCompanyAddress] = useState('123 Main St, City, State 12345');
  const [netWeight, setNetWeight] = useState('');
  const [lotCode, setLotCode] = useState(batchData?.batchNumber || batchData?.lotNumber || '');
  const [expirationDate, setExpirationDate] = useState('');
  const [servingsPerContainer, setServingsPerContainer] = useState('');
  const [quantityMax] = useState<number>(batchData?.maxQuantity || 1000);
  
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
  const [templateName, setTemplateName] = useState('');
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editModeTemplateName, setEditModeTemplateName] = useState<string>('');
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [barcodeValue, setBarcodeValue] = useState<string>('');

  // Filter templates based on page-level team selection
  const filteredSavedTemplates = useMemo(() => {
    // If no team selected (viewing "All Teams"), show all templates
    if (!selectedTeamId) return savedTemplates;
    
    // Filter to show only selected team's templates
    return savedTemplates.filter(t => t.team_id === selectedTeamId);
  }, [savedTemplates, selectedTeamId]);

  // Filter items based on page-level team selection
  const filteredItems = useMemo(() => {
    // If no team selected (admin viewing "All Teams"), show all items
    if (!selectedTeamId) return items;
    
    // Filter to show only selected team's items
    return items.filter(item => item.team_id === selectedTeamId);
  }, [items, selectedTeamId]);

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

  // Auto-sync batch number when batch context changes
  useEffect(() => {
    if (batchData?.batchNumber) {
      setLotCode(batchData.batchNumber);
    } else if (batchData?.lotNumber) {
      setLotCode(batchData.lotNumber);
    }
  }, [batchData?.batchNumber, batchData?.lotNumber]);

  // Restore draft data on mount (only if no batch/preselected data)
  useEffect(() => {
    if (shouldUseDraft && draftData && !draftLoading && !hasRestoredDraft.current) {
      console.log('📄 Restoring label draft data...');
      
      // Restore all fields from draft
      if (draftData.selectedItemId) setSelectedItemId(draftData.selectedItemId);
      if (draftData.selectedTemplate) setSelectedTemplate(draftData.selectedTemplate);
      if (draftData.companyName) setCompanyName(draftData.companyName);
      if (draftData.companyAddress) setCompanyAddress(draftData.companyAddress);
      if (draftData.netWeight) setNetWeight(draftData.netWeight);
      if (draftData.lotCode) setLotCode(draftData.lotCode);
      if (draftData.expirationDate) setExpirationDate(draftData.expirationDate);
      if (draftData.ingredients) setIngredients(draftData.ingredients);
      if (draftData.servingSize) setServingSize(draftData.servingSize);
      if (draftData.servingsPerContainer) setServingsPerContainer(draftData.servingsPerContainer);
      if (draftData.calories) setCalories(draftData.calories);
      if (draftData.totalFat) setTotalFat(draftData.totalFat);
      if (draftData.saturatedFat) setSaturatedFat(draftData.saturatedFat);
      if (draftData.transFat) setTransFat(draftData.transFat);
      if (draftData.cholesterol) setCholesterol(draftData.cholesterol);
      if (draftData.sodium) setSodium(draftData.sodium);
      if (draftData.totalCarbs) setTotalCarbs(draftData.totalCarbs);
      if (draftData.dietaryFiber) setDietaryFiber(draftData.dietaryFiber);
      if (draftData.totalSugars) setTotalSugars(draftData.totalSugars);
      if (draftData.addedSugars) setAddedSugars(draftData.addedSugars);
      if (draftData.protein) setProtein(draftData.protein);
      if (draftData.vitaminD) setVitaminD(draftData.vitaminD);
      if (draftData.calcium) setCalcium(draftData.calcium);
      if (draftData.iron) setIron(draftData.iron);
      if (draftData.potassium) setPotassium(draftData.potassium);
      if (draftData.allergens) setAllergens(draftData.allergens);
      if (draftData.quantityToPrint) setQuantityToPrint(draftData.quantityToPrint);
      if (draftData.barcodeValue) setBarcodeValue(draftData.barcodeValue);
      
      // Mark as restored and show toast only once
      hasRestoredDraft.current = true;
      toast.success('Draft restored! Your previous work has been recovered.', {
        duration: 3000,
      });
    }
  }, [draftData, draftLoading, shouldUseDraft]);

  // Handle item selection and auto-calculate expiration date
  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItem(null);
      return;
    }

    const selectedItemFromList = filteredItems.find(i => i.id === selectedItemId) || null;
    
    if (selectedItemFromList?.id !== selectedItem?.id) {
      setSelectedItem(selectedItemFromList);
      
      if (selectedItemFromList) {
        // Use batch number if available, otherwise generate lot number
        if (!batchData?.batchNumber) {
          const companyPrefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
          const lotNumber = BarcodeGenerator.generateLotNumber(companyPrefix || 'LOT');
          setLotCode(lotNumber);
        }
        
        // Auto-calculate expiration date if shelf life is set
        if (selectedItemFromList.shelf_life_days && selectedItemFromList.shelf_life_days > 0) {
          const today = new Date();
          const expiryDate = new Date(today);
          expiryDate.setDate(today.getDate() + selectedItemFromList.shelf_life_days);
          
          // Format as YYYY-MM-DD for input field
          const formattedDate = expiryDate.toISOString().split('T')[0];
          setExpirationDate(formattedDate);
          
          toast.success(`Expiration date set to ${expiryDate.toLocaleDateString()} (${selectedItemFromList.shelf_life_days} days from today)`);
        }
      }
    }
  }, [selectedItemId, filteredItems, selectedItem?.id, companyName, batchData?.batchNumber]);

  // Auto-detect and select label template when batch data is provided
  useEffect(() => {
    if (batchData?.itemId && selectedItem && !loadedTemplateId && filteredSavedTemplates.length > 0) {
      console.log('🔍 Auto-detecting label template for batch item...');
      
      // Try to find a template that matches the item's category or is named after the item
      const matchingTemplate = filteredSavedTemplates.find(template => {
        // Check if template name contains the item name
        const nameMatch = template.name.toLowerCase().includes(selectedItem.name.toLowerCase());
        // Check if template has same item ID in its saved data
        const itemMatch = template.selectedItemId === selectedItem.id;
        return nameMatch || itemMatch;
      });
      
      if (matchingTemplate) {
        console.log('✅ Found matching template:', matchingTemplate.name);
        loadTemplate(matchingTemplate, false);
        toast.success(`Template "${matchingTemplate.name}" auto-selected for ${selectedItem.name}`, {
          duration: 4000,
        });
      } else {
        console.log('⚠️ No matching template found for item');
        toast.info(`No label template found for "${selectedItem.name}". Please select a template or configure a new one.`, {
          duration: 5000,
        });
      }
    }
  }, [batchData?.itemId, selectedItem, loadedTemplateId, filteredSavedTemplates]);

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

  // Save or update template function (Database-backed)
  const saveTemplate = async (forceNew: boolean = false) => {
    // Validate template name for new templates or when editing
    if (!templateName.trim() && (!loadedTemplateId || forceNew)) {
      toast.error('Please enter a template name');
      return;
    }
    
    if (!selectedTeamId) {
      toast.error('Please select a team first');
      return;
    }

    console.log('🎯 Save template button clicked', { 
      templateName, 
      editingTemplateId,
      loadedTemplateId,
      forceNew,
      selectedTeamId,
      hasUser: !!user,
      userId: user?.id,
      orgId: user?.organizationId
    });

    setSavingToDatabase(true);
    
    const templateData: Omit<SavedTemplate, 'id' | 'createdAt'> = {
      name: templateName || loadedTemplateName, // Use loadedTemplateName for updates
      companyName,
      companyAddress,
      netWeight,
      logoUrl: undefined, // Will be set by upload
      ingredients,
      servingSize,
      servingsPerContainer,
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
      expirationDate,
      productName: selectedItem?.name || '',
      sku: selectedItem?.sku || '',
      lotCode,
      barcodeValue: barcodeValue || selectedItem?.id || '',
      selectedItemId: selectedItem?.id
    };

    try {
      let result;
      
      // Scenario 1: Explicitly editing (Edit button was clicked)
      if (editingTemplateId) {
        console.log('📝 Updating existing template (edit mode):', editingTemplateId);
        result = await updateTemplateInDb(editingTemplateId, templateData, logoFile || undefined, selectedTeamId);
        console.log('📝 Update result:', result);
        setEditingTemplateId(null);
        setEditModeTemplateName('');
        setLoadedTemplateId(null);
        setLoadedTemplateName('');
      } 
      // Scenario 2: Template is loaded and we're updating it (not creating new)
      else if (loadedTemplateId && !forceNew) {
        console.log('📝 Updating loaded template:', loadedTemplateId);
        result = await updateTemplateInDb(loadedTemplateId, templateData, logoFile || undefined, selectedTeamId);
        console.log('📝 Update result:', result);
        // Keep loadedTemplateId so user can continue making updates
      }
      // Scenario 3: Creating new template
      else {
        console.log('➕ Creating new template');
        result = await saveTemplateToDb(templateData, logoFile || undefined, selectedTeamId);
        console.log('➕ Create result:', result);
        // Set the newly created template as loaded
        if (result) {
          setLoadedTemplateId(result);
          setLoadedTemplateName(templateData.name);
        }
      }
      
      if (result) {
        setTemplateName('');
        console.log('✅ Template save successful');
      } else {
        console.warn('⚠️ Template save returned null/false');
      }
    } catch (error) {
      console.error('❌ Template save exception:', error);
      toast.error('Template save failed with exception');
    } finally {
      setSavingToDatabase(false);
      console.log('🏁 Save template process completed');
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingTemplateId(null);
    setEditModeTemplateName('');
    setTemplateName('');
    toast.info('Edit mode cancelled');
  };

  // Unload template
  const unloadTemplate = () => {
    setLoadedTemplateId(null);
    setLoadedTemplateName('');
    setLogoPreview('');
    setLogoData('');
    setLogoFile(null);
    setLogoUploadStatus('idle');
    toast.info('Template unloaded');
  };

  // Load template function (Database-backed)
  const loadTemplate = async (template: SavedTemplate, forEditing: boolean = false) => {
    setCompanyName(template.companyName);
    setCompanyAddress(template.companyAddress);
    setNetWeight(template.netWeight);
    
    // Handle logo - use URL instead of base64
    if (template.logoUrl) {
      setLogoPreview(template.logoUrl);
      setLogoData(template.logoUrl);
      setLogoUploadStatus('success');
    } else {
      setLogoPreview('');
      setLogoData('');
      setLogoUploadStatus('idle');
    }
    
    setIngredients(template.ingredients);
    setServingSize(template.servingSize);
    setServingsPerContainer(template.servingsPerContainer);
    setCalories(template.calories);
    setTotalFat(template.totalFat);
    setSaturatedFat(template.saturatedFat);
    setTransFat(template.transFat);
    setCholesterol(template.cholesterol);
    setSodium(template.sodium);
    setTotalCarbs(template.totalCarbs);
    setDietaryFiber(template.dietaryFiber);
    setTotalSugars(template.totalSugars);
    setAddedSugars(template.addedSugars);
    setProtein(template.protein);
    setVitaminD(template.vitaminD);
    setCalcium(template.calcium);
    setIron(template.iron);
    setPotassium(template.potassium);
    setAllergens(template.allergens);
    setExpirationDate(template.expirationDate);
    
    // Prioritize current batch number over saved template value
    if (batchData?.batchNumber) {
      setLotCode(batchData.batchNumber);
    } else if (batchData?.lotNumber) {
      setLotCode(batchData.lotNumber);
    }
    // Otherwise, lotCode remains at its current value (either from batch or generated)
    
    if (template.selectedItemId) {
      setSelectedItemId(template.selectedItemId);
    }
    
    // Always track which template is loaded
    setLoadedTemplateId(template.id);
    setLoadedTemplateName(template.name);
    
    if (forEditing) {
      setEditingTemplateId(template.id);
      setEditModeTemplateName(template.name);
      setTemplateName(template.name);
      toast.info(`Editing template "${template.name}". Make changes and click "Update Template".`, {
        duration: 4000
      });
    } else {
      setEditingTemplateId(null);
      setEditModeTemplateName('');
      const batchMessage = batchData?.batchNumber 
        ? ` (Batch #${batchData.batchNumber})` 
        : '';
      toast.success(`Template "${template.name}" loaded! You can update it or save as new.`, {
        duration: 4000
      });
    }
  };

  // Delete template function (Database-backed)
  const deleteTemplate = async (templateId: string) => {
    try {
      setDeletingTemplateId(templateId);
      await deleteTemplateFromDb(templateId);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // Input handlers
  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCompanyName(newValue);
    updateDraft({ companyName: newValue });
  }, [updateDraft]);

  const handleItemSelect = useCallback((value: string) => {
    setSelectedItemId(value);
    updateDraft({ selectedItemId: value });
  }, [updateDraft]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    updateDraft({ selectedTemplate: templateId });
  }, [updateDraft]);

  const handleIngredientsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setIngredients(value);
    updateDraft({ ingredients: value });
  }, [updateDraft]);

  const handleServingSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setServingSize(value);
    updateDraft({ servingSize: value });
  }, [updateDraft]);

  const handleCaloriesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCalories(value);
    updateDraft({ calories: value });
  }, [updateDraft]);

  const handleTotalFatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTotalFat(value);
    updateDraft({ totalFat: value });
  }, [updateDraft]);

  const handleSodiumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSodium(value);
    updateDraft({ sodium: value });
  }, [updateDraft]);

  const handleTotalCarbsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTotalCarbs(value);
    updateDraft({ totalCarbs: value });
  }, [updateDraft]);

  const handleProteinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProtein(value);
    updateDraft({ protein: value });
  }, [updateDraft]);

  const handleAllergensChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAllergens(value);
    updateDraft({ allergens: value });
  }, [updateDraft]);

  const handleCompanyAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanyAddress(value);
    updateDraft({ companyAddress: value });
  }, [updateDraft]);

  const handleNetWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNetWeight(value);
    updateDraft({ netWeight: value });
  }, [updateDraft]);

  const handleSaturatedFatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSaturatedFat(value);
    updateDraft({ saturatedFat: value });
  }, [updateDraft]);

  const handleTransFatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransFat(value);
    updateDraft({ transFat: value });
  }, [updateDraft]);

  const handleCholesterolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCholesterol(value);
    updateDraft({ cholesterol: value });
  }, [updateDraft]);

  const handleDietaryFiberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDietaryFiber(value);
    updateDraft({ dietaryFiber: value });
  }, [updateDraft]);

  const handleTotalSugarsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTotalSugars(value);
    updateDraft({ totalSugars: value });
  }, [updateDraft]);

  const handleAddedSugarsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddedSugars(value);
    updateDraft({ addedSugars: value });
  }, [updateDraft]);

  const handleVitaminDChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVitaminD(value);
    updateDraft({ vitaminD: value });
  }, [updateDraft]);

  const handleCalciumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCalcium(value);
    updateDraft({ calcium: value });
  }, [updateDraft]);

  const handleIronChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIron(value);
    updateDraft({ iron: value });
  }, [updateDraft]);

  const handlePotassiumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPotassium(value);
    updateDraft({ potassium: value });
  }, [updateDraft]);

  const handleTemplateNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value);
  }, []);

  const handleExpirationDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpirationDate(value);
    updateDraft({ expirationDate: value });
  }, [updateDraft]);

  const handleServingsPerContainerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setServingsPerContainer(value);
    updateDraft({ servingsPerContainer: value });
  }, [updateDraft]);

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
      let y = 0.1; // Start with small top margin

      // Logo and Company Header - Compact Optimized Layout
      if (logoData) {
        try {
          console.log('[PDF_LOGO] Attempting to add logo to PDF');
          console.log('[PDF_LOGO] Logo data format:', logoData.substring(0, 50));
          
          let imageData = logoData;
          
          // If logoData is a URL (from template), convert to base64
          if (logoData.startsWith('http://') || logoData.startsWith('https://')) {
            console.log('[PDF_LOGO] Logo is URL from template, converting to base64...');
            imageData = await convertUrlToBase64(logoData);
            console.log('[PDF_LOGO] URL converted to base64 successfully');
          } else if (!logoData.startsWith('data:')) {
            // If it's raw base64 without data: prefix
            imageData = `data:image/png;base64,${logoData}`;
          }
          
          // Optimized logo size - balanced for space efficiency
          const logoSize = 0.65;
          const logoX = 2 - (logoSize / 2); // Center on 4" label
          const logoY = y;
          
          // Add logo
          pdf.addImage(imageData, 'PNG', logoX, logoY, logoSize, logoSize);
          console.log('[PDF_LOGO] Logo added successfully at size:', logoSize);
          
          // Company name centered under logo with proper spacing
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(companyName.toUpperCase(), 2, logoY + logoSize + 0.12, { align: 'center' });
          
          // Company address - split to multiple lines if long
          if (companyAddress.trim()) {
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            const addressLines = pdf.splitTextToSize(companyAddress, 3.6);
            pdf.text(addressLines, 2, logoY + logoSize + 0.21, { align: 'center' });
            y = logoY + logoSize + 0.21 + (addressLines.length * 0.08) + 0.08;
          } else {
            y = logoY + logoSize + 0.2;
          }
        } catch (error) {
          console.error('[PDF_LOGO] Failed to add logo to PDF:', error);
          console.log('[PDF_LOGO] Logo data type:', typeof logoData);
          console.log('[PDF_LOGO] Logo data length:', logoData?.length || 0);
          
          // Fallback: Just company name and address
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(companyName.toUpperCase(), 2, y + 0.1, { align: 'center' });
          
          if (companyAddress.trim()) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            const addressLines = pdf.splitTextToSize(companyAddress, 3.6);
            pdf.text(addressLines, 2, y + 0.22, { align: 'center' });
            y += 0.22 + (addressLines.length * 0.09) + 0.05;
          } else {
            y += 0.2;
          }
        }
      } else if (companyName) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(companyName.toUpperCase(), 2, y + 0.1, { align: 'center' });
        
        if (companyAddress.trim()) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          const addressLines = pdf.splitTextToSize(companyAddress, 3.6);
          pdf.text(addressLines, 2, y + 0.22, { align: 'center' });
          y += 0.22 + (addressLines.length * 0.09) + 0.05;
        } else {
          y += 0.2;
        }
      }

      // Divider line
      pdf.setLineWidth(0.01);
      pdf.line(0.2, y, 3.8, y);
      y += 0.08;

      // Product Name (large, centered)
      pdf.setFontSize(15);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedItem.name, 2, y + 0.13, { align: 'center' });
      y += 0.2;

      // Net Weight (centered, compact)
      if (template.fields.includes('netweight') && netWeight && netWeight.trim()) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Net Weight: ${netWeight}`, 2, y + 0.12, { align: 'center' });
        y += 0.18;
      }

      // Date and Expiration on same line to save space
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString();
      
      if (expirationDate && expirationDate.trim()) {
        // Both date and expiration
        pdf.text(`DATE: ${currentDate}`, 0.2, y + 0.08);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`EXP: ${expirationDate}`, 3.8, y + 0.08, { align: 'right' });
        y += 0.15;
      } else {
        // Just date, right aligned
        pdf.text(`DATE: ${currentDate}`, 3.8, y + 0.08, { align: 'right' });
        y += 0.15;
      }

      // LOT/BATCH Code - Show BATCH if from manufacturing batch
      if (template.fields.includes('lot') && lotCode) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        const codeLabel = batchData?.batchNumber ? 'BATCH' : 'LOT';
        pdf.text(`${codeLabel}: ${lotCode}`, 0.2, y + 0.08);
        y += 0.18;
      }

      // Barcode (centered, compact) with SKU below
      try {
        const barcodeValue = selectedItem.barcode || selectedItem.sku || lotCode;
        const barcodeImage = BarcodeGenerator.generateBarcode(barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 30,
          displayValue: false, // We'll add SKU manually below
          background: '#ffffff',
          lineColor: '#000000'
        });
        
        if (barcodeImage) {
          pdf.addImage(barcodeImage, 'PNG', 0.5, y, 3, 0.45);
          y += 0.48;
          
          // Add SKU text centered below barcode
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`SKU: ${barcodeValue}`, 2, y, { align: 'center' });
          y += 0.15;
        }
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }

      // FDA-Compliant Nutrition Facts Table - Compact Two-Column Layout
      if (template.fields.includes('nutrition') && (servingSize || calories)) {
        console.log('[PDF_NUTRITION] Starting compact two-column nutrition facts table generation');
        
        // Nutrition Facts header
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nutrition Facts', 0.2, y + 0.08);
        y += 0.18;

        // Main nutrition facts box with borders
        const boxWidth = 3.6;
        const boxStartY = y;
        const leftColX = 0.3;
        const rightColX = 2.1; // Split at ~55%
        const rightColWidth = 1.5;
        
        pdf.setLineWidth(0.03); // Thicker border for FDA compliance
        
        // Servings per container (compact)
        if (servingsPerContainer) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Servings per container: ${servingsPerContainer}`, leftColX, y + 0.08);
          y += 0.12;
        }
        
        // Serving size section (compact)
        if (servingSize) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Serving size: ${servingSize}`, leftColX, y + 0.08);
          y += 0.12;
          
          // Thick line under serving size
          pdf.setLineWidth(0.02);
          pdf.line(0.2, y, 3.8, y);
          y += 0.05;
        }

        // Calories (compact)
        if (calories) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Calories ${calories}`, leftColX, y + 0.1);
          y += 0.16;
          
          // Thick line under calories
          pdf.setLineWidth(0.02);
          pdf.line(0.2, y, 3.8, y);
          y += 0.06;
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
              rightY += 0.09; // Tighter spacing for compact layout
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

        // Daily value footnote (compact) - positioned at bottom right of nutrition box
        const hasAnyDailyValues = mainNutrients.some(n => n.dvKey && calculateDailyValue(n.dvKey, n.value) !== '');
        if (hasAnyDailyValues) {
          y += 0.03;
          pdf.setFontSize(4.5);
          pdf.setFont('helvetica', 'normal');
          pdf.text('*% Daily Value based on 2000 calorie diet', 3.7, y + 0.06, { align: 'right' });
          y += 0.08; // Tighter spacing
        }
        
        console.log('[PDF_NUTRITION] Compact two-column nutrition facts table completed');
      }

        // Ingredients (compact)
        if (template.fields.includes('ingredients') && ingredients.trim()) {
          y += 0.15; // Add proper spacing after nutrition box
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.text('INGREDIENTS:', 0.2, y);
        y += 0.12;
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const ingredientLines = pdf.splitTextToSize(ingredients, 3.6);
        pdf.text(ingredientLines, 0.2, y);
        y += (ingredientLines.length * 0.09) + 0.08;
      }

      // Allergens - Compact FDA compliance section
      if (template.fields.includes('allergens')) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CONTAINS:', 0.2, y);
        y += 0.1;
        
        if (allergens.trim()) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          const allergenLines = pdf.splitTextToSize(allergens.toUpperCase(), 3.6);
          pdf.text(allergenLines, 0.2, y);
          y += (allergenLines.length * 0.09) + 0.08;
        } else {
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'italic');
          pdf.text('(To be filled as applicable)', 0.2, y);
          y += 0.12;
        }
      }

      // FDA-compliant footer - Compact positioning
      const footerY = Math.max(y + 0.15, 5.7);
      
      if (template.fields.includes('address') && companyAddress.trim()) {
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Distributed by ${companyName}`, 2, footerY, { align: 'center' });
        const footerAddressLines = pdf.splitTextToSize(companyAddress, 3.6);
        pdf.setFontSize(5.5);
        pdf.text(footerAddressLines, 2, footerY + 0.1, { align: 'center' });
      } else {
        pdf.setFontSize(5.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Distributed by ${companyName}`, 2, footerY + 0.15, { align: 'center' });
      }

      // Save PDF
      const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${selectedItem.name.replace(/[^a-zA-Z0-9]/g, '-')}-${template.id}.pdf`;
      pdf.save(filename);
      
      // Record in database
      try {
        await recordLabelGeneration({
          itemId: selectedItem.id,
          lotId: batchData?.lotId,
          batchId: batchData?.batchId,
          labelData: {
            templateId: selectedTemplate,
            productName: selectedItem.name,
            sku: selectedItem.sku,
            lotCode: lotCode,
            batchNumber: batchData?.batchNumber,
            companyName: companyName,
            manufacturingDate: new Date().toISOString(),
            expirationDate: expirationDate,
          },
          printFormat: 'PDF',
          quantityPrinted: quantityToPrint,
        });
        
        const batchInfo = batchData?.batchNumber ? ` for Batch #${batchData.batchNumber}` : '';
        toast.success(`Label generated and ${quantityToPrint} unit(s) recorded successfully${batchInfo}!`);
        clearDraft(); // Clear saved draft after successful generation
      } catch (dbError) {
        console.error('Failed to record in database:', dbError);
        toast.warning('Label generated but failed to record in tracking system');
        clearDraft(); // Still clear draft even if DB recording fails
      }
      
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderLabelForm = () => {
    // SIMPLIFIED BATCH PRINT MODE - Only show preview, quantity, and print button
    if (batchData && selectedItem) {
      return (
        <div className="space-y-6">
          {/* Batch Info Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground mb-1">
                    Manufacturing Batch #{batchData.batchNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Product: <span className="font-medium text-foreground">{selectedItem.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{batchData.maxQuantity} units remaining</span>
                    <span>•</span>
                    <span>Batch ID: {batchData.batchId.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Auto-Detection Status */}
          {!loadedTemplateId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Template Found</AlertTitle>
              <AlertDescription>
                No label template was found for {selectedItem.name}. Please create a label template for this product in the Labels & Barcodes tab before printing batch labels.
              </AlertDescription>
            </Alert>
          )}

          {/* Label Preview */}
          {loadedTemplateId && (
            <LabelPreview
              selectedItem={selectedItem}
              companyName={companyName}
              companyAddress={companyAddress}
              netWeight={netWeight}
              logoPreview={logoPreview}
              lotCode={lotCode}
              expirationDate={expirationDate}
              servingSize={servingSize}
              calories={calories}
              ingredients={ingredients}
              allergens={allergens}
            />
          )}

          {/* Quantity to Print */}
          {loadedTemplateId && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-5 w-5 text-primary" />
                  Quantity to Print
                </CardTitle>
                <CardDescription>
                  Up to {batchData.maxQuantity} labels can be printed for this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label htmlFor="quantity" className="text-sm font-medium min-w-[100px]">
                    Quantity:
                  </Label>
                  <Input
                    id="quantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={`Enter quantity (max: ${batchData.maxQuantity})`}
                    value={quantityToPrint}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, '');
                      if (input === '') {
                        setQuantityToPrint(1);
                        return;
                      }
                      const val = Math.max(1, parseInt(input) || 1);
                      setQuantityToPrint(Math.min(val, batchData.maxQuantity || val));
                    }}
                    className="max-w-[200px]"
                  />
                  <span className="text-sm text-muted-foreground">
                    label{quantityToPrint !== 1 ? 's' : ''}
                  </span>
                </div>
                {quantityToPrint > (batchData.maxQuantity || 0) && (
                  <p className="text-sm text-destructive mt-2">
                    Cannot print more than {batchData.maxQuantity} labels (remaining unlabeled units)
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Print Button */}
          {loadedTemplateId && (
            <Button 
              onClick={generateLabel}
              disabled={
                isGenerating || 
                savingToDatabase || 
                quantityToPrint > (batchData.maxQuantity || 0) ||
                !loadedTemplateId
              }
              className="w-full py-8 text-xl"
              size="lg"
            >
              <Download className="mr-3 h-6 w-6" />
              {isGenerating || savingToDatabase 
                ? 'Generating Labels...' 
                : `Generate ${quantityToPrint} Label${quantityToPrint !== 1 ? 's' : ''}`
              }
            </Button>
          )}
        </div>
      );
    }

    // REGULAR FULL EDITING MODE
    return (
    <div className="space-y-6">
      {/* Draft Status Indicator */}
      {shouldUseDraft && lastSaved && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Save className="h-4 w-4" />
                <span>Draft auto-saved {new Date(lastSaved).toLocaleTimeString()}</span>
              </div>
              <Button
                onClick={clearDraft}
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Mode Banner */}
      {editingTemplateId && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
          <Edit className="h-4 w-4" />
          <AlertTitle>Editing Template</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You are editing: <strong>{editModeTemplateName}</strong></span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cancelEdit}
              className="ml-4"
            >
              Cancel Edit
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
          <Utensils className="h-5 w-5" />
          <span className="font-medium">FDA-Compliant Food Label Generator Ready!</span>
        </div>
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          Now supports professional nutrition facts tables, company addresses, and thermal printer optimization.
        </p>
      </div>

      {/* Batch Info - Only show if FROM batch */}
      {batchData && selectedItem && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground mb-1">
                  Manufacturing Batch #{batchData.batchNumber}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Product: <span className="font-medium text-foreground">{selectedItem.name}</span>
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{batchData.maxQuantity} units remaining</span>
                  <span>•</span>
                  <span>Batch ID: {batchData.batchId.slice(0, 8)}...</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Product pre-selected from batch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Selection - Only show if NOT from batch */}
      {!batchData && (
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
            <SelectContent className="bg-background">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No products found for this team.</p>
                  <p className="text-sm mt-1">Add products in the Product Catalog tab.</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{item.name}</span>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        {item.sku || 'No SKU'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedItem?.shelf_life_days && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-400">
              ℹ️ This product has a shelf life of {selectedItem.shelf_life_days} days - expiration date will be calculated automatically
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Template Management - MOVED TO TOP */}
      {selectedItem && (
        <Card className="border-primary/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
              Label Templates
            </CardTitle>
            <CardDescription>
              Save and load label configurations for faster generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {templatesLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Loading templates...
                  </p>
                ) : filteredSavedTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {selectedTeamId 
                      ? 'No templates found for the selected team' 
                      : 'No saved templates yet'}
                  </p>
                ) : (
                  filteredSavedTemplates.map((template) => (
                        <div key={template.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          {template.logoUrl && (
                            <img 
                              src={template.logoUrl} 
                              alt="Template logo"
                              className="w-12 h-12 object-contain rounded border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(template.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => loadTemplate(template, false)}
                              size="sm"
                              variant="outline"
                              title="Load template"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => loadTemplate(template, true)}
                              size="sm"
                              variant="outline"
                              title="Edit template"
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  title="Delete template"
                                  disabled={deletingTemplateId === template.id}
                                >
                                  {deletingTemplateId === template.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteTemplate(template.id)}
                                    disabled={deletingTemplateId === template.id}
                                  >
                                    {deletingTemplateId === template.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      'Delete'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

              {/* Show loaded template info */}
              {loadedTemplateId && !editingTemplateId && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Using template: {loadedTemplateName}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        You can update this template or save your changes as a new one
                      </p>
                    </div>
                    <Button
                      onClick={unloadTemplate}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Editing mode indicator */}
              {editingTemplateId && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Editing: {editModeTemplateName}
                    </p>
                    <Button
                      onClick={cancelEdit}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel Edit
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">
                  {editingTemplateId 
                    ? 'Template Name (Editing)' 
                    : loadedTemplateId 
                      ? 'Save Changes' 
                      : 'Save Current Configuration'}
                </Label>

                {/* Buttons based on state */}
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  {loadedTemplateId && !editingTemplateId ? (
                    <>
                      {/* Update the loaded template */}
                      <Button
                        onClick={() => saveTemplate(false)}
                        disabled={!companyName.trim() || savingToDatabase}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Update {loadedTemplateName}
                      </Button>
                      
                      {/* Save as new template */}
                      <Input
                        value={templateName}
                        onChange={handleTemplateNameChange}
                        placeholder="Enter name for new template"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => saveTemplate(true)}
                        disabled={!templateName.trim() || !companyName.trim() || savingToDatabase}
                        variant="outline"
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save as New
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Standard save/update when editing or creating new */}
                      <Input
                        value={templateName}
                        onChange={handleTemplateNameChange}
                        placeholder="Template name (e.g., 'Organic Products')"
                        className={editingTemplateId ? "flex-1 border-blue-500" : "flex-1"}
                      />
                      <Button
                        onClick={() => saveTemplate(false)}
                        disabled={!templateName.trim() || !companyName.trim() || savingToDatabase}
                        variant={editingTemplateId ? "default" : "outline"}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {editingTemplateId ? 'Update Template' : 'Save as Template'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    onChange={handleCompanyAddressChange}
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
                    onChange={handleNetWeightChange}
                    placeholder="e.g., 1 lb (454g)"
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
                <Label className="text-sm font-medium">
                  {batchData?.batchNumber ? 'Manufacturing Batch Number' : 'Generated Lot Code'}
                </Label>
                <div className="mt-1 p-2 bg-muted/50 rounded border">
                  <code className="text-sm font-mono">{lotCode}</code>
                </div>
                {batchData?.batchNumber && (
                  <p className="text-xs text-muted-foreground mt-1">
                    From Manufacturing Batch - This will appear as "BATCH:" on the label
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Barcode Value</Label>
                <div className="mt-1 p-2 bg-muted/50 rounded border">
                  <code className="text-sm font-mono">
                    {selectedItem.barcode || selectedItem.sku || lotCode}
                  </code>
                </div>
              </div>
              <div>
                <Label htmlFor="expiration-date" className="text-sm font-medium">Expiration Date</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={handleExpirationDateChange}
                  placeholder="MM/DD/YYYY"
                  className="mt-1"
                />
                {selectedItem?.shelf_life_days && expirationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ✓ Auto-calculated based on {selectedItem.shelf_life_days}-day shelf life (you can adjust if needed)
                  </p>
                )}
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
                    placeholder="List ingredients in descending order by weight (e.g., Water, Wheat flour, Sugar, Salt...)"
                    className="mt-1 min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    List in descending order by weight. Must comply with FDA labeling requirements.
                  </p>
                </div>
              )}

              {/* Serving Size, Servings Per Container & Calories */}
              {templateFields.includes('nutrition') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="servings-per-container" className="text-sm font-medium">Servings Per Container</Label>
                    <Input
                      id="servings-per-container"
                      type="number"
                      value={servingsPerContainer}
                      onChange={handleServingsPerContainerChange}
                      placeholder="e.g., 8"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for FDA compliance
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="serving-size" className="text-sm font-medium">Serving Size</Label>
                    <Input
                      id="serving-size"
                      value={servingSize}
                      onChange={handleServingSizeChange}
                      placeholder="e.g., 1 cup (240ml)"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calories" className="text-sm font-medium">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={calories}
                      onChange={handleCaloriesChange}
                      placeholder="e.g., 250"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Macronutrients Grid */}
              {templateFields.includes('nutrition') && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Macronutrients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total-fat" className="text-sm font-medium">Total Fat (g)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="total-fat"
                          type="number"
                          step="0.1"
                          value={totalFat}
                          onChange={handleTotalFatChange}
                          placeholder="e.g., 8"
                        />
                        {totalFat && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('totalFat', totalFat)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="saturated-fat" className="text-sm font-medium">Saturated Fat (g)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="saturated-fat"
                          type="number"
                          step="0.1"
                          value={saturatedFat}
                          onChange={handleSaturatedFatChange}
                          placeholder="e.g., 3"
                        />
                        {saturatedFat && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('saturatedFat', saturatedFat)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="trans-fat" className="text-sm font-medium">Trans Fat (g)</Label>
                      <Input
                        id="trans-fat"
                        type="number"
                        step="0.1"
                        value={transFat}
                        onChange={handleTransFatChange}
                        placeholder="e.g., 0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cholesterol" className="text-sm font-medium">Cholesterol (mg)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="cholesterol"
                          type="number"
                          value={cholesterol}
                          onChange={handleCholesterolChange}
                          placeholder="e.g., 30"
                        />
                        {cholesterol && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('cholesterol', cholesterol)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="sodium" className="text-sm font-medium">Sodium (mg)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="sodium"
                          type="number"
                          value={sodium}
                          onChange={handleSodiumChange}
                          placeholder="e.g., 470"
                        />
                        {sodium && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('sodium', sodium)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="total-carbs" className="text-sm font-medium">Total Carbohydrates (g)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="total-carbs"
                          type="number"
                          step="0.1"
                          value={totalCarbs}
                          onChange={handleTotalCarbsChange}
                          placeholder="e.g., 37"
                        />
                        {totalCarbs && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('totalCarbs', totalCarbs)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dietary-fiber" className="text-sm font-medium">Dietary Fiber (g)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="dietary-fiber"
                          type="number"
                          step="0.1"
                          value={dietaryFiber}
                          onChange={handleDietaryFiberChange}
                          placeholder="e.g., 4"
                        />
                        {dietaryFiber && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('dietaryFiber', dietaryFiber)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="total-sugars" className="text-sm font-medium">Total Sugars (g)</Label>
                      <Input
                        id="total-sugars"
                        type="number"
                        step="0.1"
                        value={totalSugars}
                        onChange={handleTotalSugarsChange}
                        placeholder="e.g., 12"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="added-sugars" className="text-sm font-medium">Added Sugars (g)</Label>
                      <Input
                        id="added-sugars"
                        type="number"
                        step="0.1"
                        value={addedSugars}
                        onChange={handleAddedSugarsChange}
                        placeholder="e.g., 10"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein" className="text-sm font-medium">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        step="0.1"
                        value={protein}
                        onChange={handleProteinChange}
                        placeholder="e.g., 3"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Micronutrients Grid */}
              {templateFields.includes('nutrition') && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Micronutrients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vitamin-d" className="text-sm font-medium">Vitamin D (mcg)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="vitamin-d"
                          type="number"
                          step="0.1"
                          value={vitaminD}
                          onChange={handleVitaminDChange}
                          placeholder="e.g., 2"
                        />
                        {vitaminD && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('vitaminD', vitaminD)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="calcium" className="text-sm font-medium">Calcium (mg)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="calcium"
                          type="number"
                          value={calcium}
                          onChange={handleCalciumChange}
                          placeholder="e.g., 260"
                        />
                        {calcium && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('calcium', calcium)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="iron" className="text-sm font-medium">Iron (mg)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="iron"
                          type="number"
                          step="0.1"
                          value={iron}
                          onChange={handleIronChange}
                          placeholder="e.g., 0.4"
                        />
                        {iron && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('iron', iron)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="potassium" className="text-sm font-medium">Potassium (mg)</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          id="potassium"
                          type="number"
                          value={potassium}
                          onChange={handlePotassiumChange}
                          placeholder="e.g., 240"
                        />
                        {potassium && (
                          <Badge variant="secondary" className="shrink-0">
                            {calculateDailyValue('potassium', potassium)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
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
                    placeholder="e.g., MILK, SOY, WHEAT"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    List major allergens in CAPITAL LETTERS (Milk, Eggs, Fish, Shellfish, Tree nuts, Peanuts, Wheat, Soybeans)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantity to Print */}
      {selectedItem && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5 text-primary" />
              Quantity to Print
            </CardTitle>
            <CardDescription>
              {batchData?.maxQuantity
                ? `Up to ${batchData.maxQuantity} labels can be printed for this batch`
                : 'Specify how many labels to generate'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="quantity" className="text-sm font-medium min-w-[100px]">
                Quantity:
              </Label>
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`Enter quantity${batchData?.maxQuantity ? ` (max: ${batchData.maxQuantity})` : ''}`}
                value={quantityToPrint}
                onChange={(e) => {
                  const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
                  if (input === '') {
                    setQuantityToPrint(1);
                    return;
                  }
                  const val = Math.max(1, parseInt(input) || 1);
                  if (batchData?.maxQuantity) {
                    setQuantityToPrint(Math.min(val, batchData.maxQuantity));
                  } else {
                    setQuantityToPrint(val);
                  }
                }}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                label{quantityToPrint !== 1 ? 's' : ''}
              </span>
            </div>
            {batchData?.maxQuantity && quantityToPrint > batchData.maxQuantity && (
              <p className="text-sm text-destructive mt-2">
                Cannot print more than {batchData.maxQuantity} labels (remaining unlabeled units)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedItem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => setShowPreview(true)}
            disabled={!companyName.trim()}
            variant="outline"
            className="w-full py-6 text-lg"
            size="lg"
          >
            <Package className="mr-2 h-5 w-5" />
            Preview Label
          </Button>
          <Button 
            onClick={generateLabel}
            disabled={
              isGenerating || 
              savingToDatabase || 
              !companyName.trim() || 
              (batchData?.maxQuantity ? quantityToPrint > batchData.maxQuantity : false)
            }
            className="w-full py-6 text-lg"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            {isGenerating || savingToDatabase ? 'Generating...' : `Generate ${quantityToPrint} Label${quantityToPrint !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Label Preview</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <LabelPreview
              selectedItem={selectedItem}
              companyName={companyName}
              companyAddress={companyAddress}
              netWeight={netWeight}
              logoPreview={logoPreview}
              lotCode={lotCode}
              expirationDate={expirationDate}
              servingSize={servingSize}
              calories={calories}
              ingredients={ingredients}
              allergens={allergens}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    );
  };

  // If used inside a modal, skip the wrapper and drawer logic
  if (inModal) {
    return (
      <div className="space-y-4">
        {renderLabelForm()}
      </div>
    );
  }

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
                {renderLabelForm()}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      ) : (
        <div className="p-6">
          {renderLabelForm()}
        </div>
      )}
    </div>
  );
};

export { ProfessionalLabelGenerator };