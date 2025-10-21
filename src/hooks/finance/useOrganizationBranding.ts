import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationBranding } from '@/types/organization';
import { toast } from 'sonner';

export const useOrganizationBranding = () => {
  const { user } = useAuth();
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      fetchBranding();
    }
  }, [user?.organizationId]);

  const fetchBranding = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('logo_url, company_address, company_city, company_state, company_postal_code, company_country, company_phone, company_email, company_website')
        .eq('id', user.organizationId)
        .single();

      if (error) throw error;
      setBranding(data);
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user?.organizationId) {
      toast.error('Organization ID not found');
      return null;
    }

    try {
      setIsUploading(true);

      // Delete old logo if it exists
      if (branding?.logo_url) {
        const oldPath = branding.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('invoice-logos')
            .remove([`${user.organizationId}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${user.organizationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-logos')
        .getPublicUrl(filePath);

      // Update organization with new logo URL
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', user.organizationId);

      if (updateError) throw updateError;

      setBranding(prev => prev ? { ...prev, logo_url: publicUrl } : { logo_url: publicUrl });
      toast.success('Logo uploaded successfully');
      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const updateBranding = async (updates: Partial<OrganizationBranding>): Promise<boolean> => {
    if (!user?.organizationId) {
      toast.error('Organization ID not found');
      return false;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', user.organizationId);

      if (error) throw error;

      setBranding(prev => prev ? { ...prev, ...updates } : updates);
      toast.success('Company branding updated');
      return true;
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding');
      return false;
    }
  };

  const deleteLogo = async (): Promise<boolean> => {
    if (!user?.organizationId || !branding?.logo_url) return false;

    try {
      const oldPath = branding.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('invoice-logos')
          .remove([`${user.organizationId}/${oldPath}`]);
      }

      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', user.organizationId);

      if (error) throw error;

      setBranding(prev => prev ? { ...prev, logo_url: undefined } : null);
      toast.success('Logo removed');
      return true;
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to remove logo');
      return false;
    }
  };

  return {
    branding,
    isLoading,
    isUploading,
    uploadLogo,
    updateBranding,
    deleteLogo,
    refreshBranding: fetchBranding,
  };
};
