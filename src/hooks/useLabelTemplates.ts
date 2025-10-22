import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { labelTemplatesApi, LabelTemplate as DBLabelTemplate } from '@/contexts/inventory/api/labelTemplates';

export interface SavedTemplate {
  id: string;
  name: string;
  companyName: string;
  companyAddress: string;
  netWeight: string;
  logoUrl?: string;
  ingredients: string;
  servingSize: string;
  servingsPerContainer: string;
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
  expirationDate: string;
  createdAt: string;
  productName?: string;
  sku?: string;
  lotCode?: string;
  barcodeValue?: string;
  selectedItemId?: string;
}

export function useLabelTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from database
  const loadTemplates = async () => {
    if (!user?.organizationId) return;
    
    try {
      setLoading(true);
      const allTemplates = await labelTemplatesApi.getAll();
      const dbTemplates = allTemplates.filter(t => 
        t.category === 'professional' && 
        t.organization_id === user.organizationId
      );
      
      // Convert DB templates to SavedTemplate format
      const converted: SavedTemplate[] = dbTemplates.map(template => {
        const data = template.template_data as any;
        return {
          id: template.id,
          name: template.name,
          companyName: data.companyName || '',
          companyAddress: data.companyAddress || '',
          netWeight: data.netWeight || '',
          logoUrl: data.logoUrl,
          ingredients: data.ingredients || '',
          servingSize: data.servingSize || '',
          servingsPerContainer: data.servingsPerContainer || '',
          calories: data.calories || '',
          totalFat: data.totalFat || '',
          saturatedFat: data.saturatedFat || '',
          transFat: data.transFat || '',
          cholesterol: data.cholesterol || '',
          sodium: data.sodium || '',
          totalCarbs: data.totalCarbs || '',
          dietaryFiber: data.dietaryFiber || '',
          totalSugars: data.totalSugars || '',
          addedSugars: data.addedSugars || '',
          protein: data.protein || '',
          vitaminD: data.vitaminD || '',
          calcium: data.calcium || '',
          iron: data.iron || '',
          potassium: data.potassium || '',
          allergens: data.allergens || '',
          expirationDate: data.expirationDate || '',
          createdAt: template.created_at,
          productName: data.productName,
          sku: data.sku,
          lotCode: data.lotCode,
          barcodeValue: data.barcodeValue,
          selectedItemId: data.selectedItemId
        };
      });
      
      setTemplates(converted);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user?.organizationId]);

  // Upload logo to storage
  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user?.organizationId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.organizationId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      return null;
    }
  };

  // Save template to database
  const saveTemplate = async (
    templateData: Omit<SavedTemplate, 'id' | 'createdAt'>,
    logoFile?: File
  ): Promise<string | null> => {
    console.log('🔵 SAVE TEMPLATE STARTED', {
      user: user?.id,
      orgId: user?.organizationId,
      hasLogo: !!logoFile,
      templateName: templateData.name
    });

    if (!user?.organizationId || !user?.id) {
      console.error('❌ SAVE FAILED: Missing user data', { 
        hasUser: !!user,
        userId: user?.id,
        orgId: user?.organizationId 
      });
      toast.error('Cannot save: User session invalid');
      return null;
    }

    try {
      let logoUrl: string | undefined;
      
      // Upload logo if provided
      if (logoFile) {
        console.log('📸 Uploading logo...', { fileName: logoFile.name, size: logoFile.size });
        logoUrl = await uploadLogo(logoFile) || undefined;
        console.log('📸 Logo upload result:', { logoUrl });
      }

      console.log('💾 Creating template in database...');
      const dbTemplate: Omit<DBLabelTemplate, 'id' | 'created_at' | 'updated_at'> = {
        organization_id: user.organizationId,
        name: templateData.name,
        description: `Professional label template`,
        category: 'professional',
        template_data: {
          ...templateData,
          logoUrl
        },
        dimensions: { width: 4, height: 6 },
        printer_type: 'thermal',
        is_active: true,
        is_default: false,
        created_by: user.id
      };

      console.log('💾 Template data prepared:', { 
        name: dbTemplate.name,
        category: dbTemplate.category,
        orgId: dbTemplate.organization_id
      });

      const created = await labelTemplatesApi.create(dbTemplate);
      console.log('✅ Template created:', { id: created.id });
      
      await loadTemplates(); // Refresh list
      console.log('🔄 Templates list refreshed');
      
      toast.success('Template saved successfully!', {
        description: `"${templateData.name}" has been saved to your library.`,
        duration: 4000
      });
      return created.id;
    } catch (error) {
      console.error('❌ SAVE TEMPLATE ERROR:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          toast.error('Permission denied', {
            description: 'You do not have permission to save templates.'
          });
        } else if (error.message.includes('unique')) {
          toast.error('Template name already exists', {
            description: 'Please choose a different name.'
          });
        } else {
          toast.error('Failed to save template', {
            description: error.message
          });
        }
      } else {
        toast.error('Failed to save template', {
          description: 'An unknown error occurred.'
        });
      }
      return null;
    }
  };

  // Update existing template
  const updateTemplate = async (
    templateId: string,
    templateData: Omit<SavedTemplate, 'id' | 'createdAt'>,
    logoFile?: File
  ): Promise<boolean> => {
    if (!user?.organizationId) return false;

    try {
      let logoUrl = templateData.logoUrl;
      
      // Upload new logo if provided
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile) || undefined;
      }

      await labelTemplatesApi.update(templateId, {
        name: templateData.name,
        template_data: {
          ...templateData,
          logoUrl
        }
      });

      await loadTemplates(); // Refresh list
      toast.success('Template updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      return false;
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    try {
      await labelTemplatesApi.delete(templateId);
      
      // Refresh list first
      await loadTemplates();
      
      // Then show success toast
      toast.success('Template deleted successfully!', {
        description: 'The template has been removed from your library.',
        duration: 4000
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template', {
        description: 'Please try again or contact support if the issue persists.'
      });
      return false;
    }
  };

  return {
    templates,
    loading,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates: loadTemplates
  };
}
