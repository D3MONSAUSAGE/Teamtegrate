import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { OnboardingResource, CreateResourceRequest, ResourceFilterOptions } from '@/types/resources';

export const useOnboardingResources = (filters?: ResourceFilterOptions) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: resources,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['onboarding-resources', user?.organizationId, filters],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization');

      let query = supabase
        .from('onboarding_resources')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OnboardingResource[];
    },
    enabled: !!user?.organizationId,
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: CreateResourceRequest) => {
      if (!user?.organizationId || !user.id) {
        throw new Error('User not authenticated');
      }

      let filePath: string | undefined;
      
      // Handle file upload if present
      if (resourceData.file) {
        const timestamp = Date.now();
        const sanitizedFileName = resourceData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        filePath = `${user.organizationId}/resources/${timestamp}-${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, resourceData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
      }

      const { data, error } = await supabase
        .from('onboarding_resources')
        .insert({
          title: resourceData.title,
          description: resourceData.description,
          resource_type: resourceData.resource_type,
          category: resourceData.category,
          tags: resourceData.tags || [],
          is_public: resourceData.is_public ?? true,
          external_url: resourceData.external_url,
          file_path: filePath,
          file_type: resourceData.file?.type,
          file_size: resourceData.file?.size,
          organization_id: user.organizationId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-resources'] });
      toast({ title: 'Resource created successfully' });
    },
    onError: (error) => {
      console.error('Error creating resource:', error);
      toast({ 
        title: 'Failed to create resource', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OnboardingResource> }) => {
      const { data, error } = await supabase
        .from('onboarding_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-resources'] });
      toast({ title: 'Resource updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update resource', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      // First get the resource to check if we need to delete from storage
      const { data: resource, error: fetchError } = await supabase
        .from('onboarding_resources')
        .select('file_path')
        .eq('id', resourceId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage if there's a file
      if (resource.file_path) {
        await supabase.storage
          .from('documents')
          .remove([resource.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('onboarding_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-resources'] });
      toast({ title: 'Resource deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete resource', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const getResourceUrl = useCallback((resource: OnboardingResource) => {
    if (resource.external_url) {
      return resource.external_url;
    }
    
    if (resource.file_path) {
      return supabase.storage
        .from('documents')
        .getPublicUrl(resource.file_path).data.publicUrl;
    }
    
    return null;
  }, []);

  return {
    resources: resources || [],
    isLoading,
    error,
    refetch,
    createResource: createResourceMutation.mutate,
    updateResource: updateResourceMutation.mutate,
    deleteResource: deleteResourceMutation.mutate,
    isCreating: createResourceMutation.isPending,
    isUpdating: updateResourceMutation.isPending,
    isDeleting: deleteResourceMutation.isPending,
    getResourceUrl,
  };
};