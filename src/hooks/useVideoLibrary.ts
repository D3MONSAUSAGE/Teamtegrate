import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoLibraryCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VideoLibraryItem {
  id: string;
  organization_id: string;
  category_id?: string;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  tags: string[];
  duration_minutes?: number;
  is_active: boolean;
  view_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: VideoLibraryCategory;
}

export interface VideoLibraryPermission {
  id: string;
  organization_id: string;
  video_id: string;
  user_id?: string;
  team_id?: string;
  permission_type: 'view' | 'manage';
  granted_by: string;
  created_at: string;
}

// Hook to fetch video library categories
export const useVideoLibraryCategories = () => {
  return useQuery({
    queryKey: ['video-library-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_library_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as VideoLibraryCategory[];
    },
  });
};

// Hook to fetch video library items (for employees)
export const useVideoLibraryItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['video-library-items', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('video_library_items')
        .select(`
          *,
          category:video_library_categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VideoLibraryItem[];
    },
  });
};

// Hook to fetch all video library items (for management)
export const useAllVideoLibraryItems = () => {
  return useQuery({
    queryKey: ['all-video-library-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_library_items')
        .select(`
          *,
          category:video_library_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VideoLibraryItem[];
    },
  });
};

// Hook to create a new category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryData: Omit<VideoLibraryCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id'>) => {
      if (!user?.organizationId) throw new Error('Organization ID not found');

      const { data, error } = await supabase
        .from('video_library_categories')
        .insert({
          ...categoryData,
          created_by: user.id,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-categories'] });
    },
  });
};

// Hook to create a new video
export const useCreateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (videoData: Omit<VideoLibraryItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id' | 'view_count' | 'category'>) => {
      if (!user?.organizationId) throw new Error('Organization ID not found');

      const { data, error } = await supabase
        .from('video_library_items')
        .insert({
          ...videoData,
          created_by: user.id,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-video-library-items'] });
    },
  });
};

// Hook to update video permissions
export const useUpdateVideoPermissions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, permissions }: { 
      videoId: string; 
      permissions: Array<{ user_id?: string; team_id?: string; permission_type: 'view' | 'manage' }> 
    }) => {
      if (!user?.organizationId) throw new Error('Organization ID not found');

      // First, delete existing permissions for this video
      await supabase
        .from('video_library_permissions')
        .delete()
        .eq('video_id', videoId);

      // Then, insert new permissions
      const permissionData = permissions.map(perm => ({
        video_id: videoId,
        organization_id: user.organizationId,
        granted_by: user.id,
        ...perm,
      }));

      const { data, error } = await supabase
        .from('video_library_permissions')
        .insert(permissionData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-video-library-items'] });
    },
  });
};

// Hook to increment view count
export const useIncrementViewCount = () => {
  return useMutation({
    mutationFn: async (videoId: string) => {
      // Get current view count and increment it
      const { data: video } = await supabase
        .from('video_library_items')
        .select('view_count')
        .eq('id', videoId)
        .single();

      if (video) {
        const { error: updateError } = await supabase
          .from('video_library_items')
          .update({ view_count: (video.view_count || 0) + 1 })
          .eq('id', videoId);

        if (updateError) throw updateError;
      }
    },
  });
};

// Hook to update a video
export const useUpdateVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, videoData }: { 
      videoId: string; 
      videoData: Partial<Omit<VideoLibraryItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id' | 'view_count' | 'category'>> 
    }) => {
      if (!user?.organizationId) throw new Error('Organization ID not found');

      const { data, error } = await supabase
        .from('video_library_items')
        .update(videoData)
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-video-library-items'] });
    },
  });
};

// Hook to delete a video
export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('video_library_items')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-video-library-items'] });
    },
  });
};