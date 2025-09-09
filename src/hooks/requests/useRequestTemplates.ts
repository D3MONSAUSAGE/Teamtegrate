import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export interface RequestTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  popularity_score: number;
  usage_count: number;
  is_public: boolean;
  is_featured: boolean;
  template_data: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  version: string;
}

export const useRequestTemplates = () => {
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('request_type_templates')
        .select('*')
        .order('popularity_score', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Failed to load request templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Omit<RequestTemplate, 'id' | 'created_at' | 'updated_at' | 'popularity_score' | 'usage_count'>) => {
    try {
      if (!user?.organizationId) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('request_type_templates')
        .insert({
          ...templateData,
          organization_id: templateData.is_public ? null : user.organizationId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      toast.success('Template created successfully');
      return data;
    } catch (err) {
      console.error('Error creating template:', err);
      toast.error('Failed to create template');
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<RequestTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('request_type_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast.success('Template updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating template:', err);
      toast.error('Failed to update template');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('request_type_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
      throw err;
    }
  };

  const getTemplatesByCategory = (category: string) => {
    return templates.filter(t => t.category === category);
  };

  const getFeaturedTemplates = () => {
    return templates.filter(t => t.is_featured).slice(0, 6);
  };

  const searchTemplates = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description?.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  useEffect(() => {
    if (user?.organizationId) {
      fetchTemplates();
    }
  }, [user?.organizationId]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    getFeaturedTemplates,
    searchTemplates,
    refetch: fetchTemplates,
  };
};