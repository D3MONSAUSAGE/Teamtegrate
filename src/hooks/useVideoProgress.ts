import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoProgress {
  user_id: string;
  course_id: string;
  module_id?: string;
  organization_id: string;
  status: string;
  progress_percentage: number;
  video_progress_percentage: number;
  video_completed_at?: string;
  video_watch_time_seconds: number;
  started_at?: string;
  completed_at?: string;
  last_accessed_at: string;
}

// Hook to get video progress for a specific module
export const useVideoProgress = (moduleId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['video-progress', moduleId, user?.id],
    queryFn: async () => {
      if (!moduleId || !user?.id) return null;

      const { data, error } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw error;
      }

      return data as VideoProgress | null;
    },
    enabled: !!moduleId && !!user?.id
  });
};

// Hook to get all video progress for a user
export const useAllVideoProgress = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['all-video-progress', targetUserId],
    queryFn: async () => {
      if (!targetUserId || !user?.organizationId) return [];

      const { data, error } = await supabase
        .from('user_training_progress')
        .select(`
          *,
          training_modules!inner(
            id,
            title,
            content_type,
            video_url,
            video_source,
            training_courses!inner(
              organization_id
            )
          )
        `)
        .eq('user_id', targetUserId)
        .eq('training_modules.training_courses.organization_id', user.organizationId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as VideoProgress[];
    },
    enabled: !!targetUserId && !!user?.organizationId
  });
};

// Mutation to update video progress
export const useUpdateVideoProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      moduleId,
      courseId,
      progressPercentage,
      watchTimeSeconds
    }: {
      moduleId: string;
      courseId: string;
      progressPercentage: number;
      watchTimeSeconds?: number;
    }) => {
      if (!user?.id || !user?.organizationId) {
        throw new Error('User not authenticated');
      }

      const progressData: any = {
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        organization_id: user.organizationId,
        video_progress_percentage: Math.round(progressPercentage),
        video_watch_time_seconds: watchTimeSeconds || Math.round(progressPercentage),
        status: progressPercentage >= 90 ? 'completed' : 'in_progress',
        progress_percentage: Math.round(progressPercentage),
        last_accessed_at: new Date().toISOString()
      };

      // Mark video as completed if 90% or more
      if (progressPercentage >= 90) {
        progressData.video_completed_at = new Date().toISOString();
        progressData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('user_training_progress')
        .upsert(progressData, {
          onConflict: 'user_id,course_id,module_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['video-progress', data.module_id] });
      queryClient.invalidateQueries({ queryKey: ['all-video-progress', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['employee-progress'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update video progress:', error);
    }
  });
};

// Mutation to mark module as completed
export const useCompleteModule = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      moduleId,
      courseId,
      completionScore
    }: {
      moduleId: string;
      courseId: string;
      completionScore?: number;
    }) => {
      if (!user?.id || !user?.organizationId) {
        throw new Error('User not authenticated');
      }

      const updateData = {
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        organization_id: user.organizationId,
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_training_progress')
        .upsert(updateData, {
          onConflict: 'user_id,course_id,module_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-progress', data.module_id] });
      queryClient.invalidateQueries({ queryKey: ['all-video-progress', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['employee-progress'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
    },
    onError: (error: Error) => {
      console.error('Failed to complete module:', error);
    }
  });
};

// Hook to get video engagement analytics for managers
export const useVideoEngagementAnalytics = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['video-engagement-analytics', user?.organizationId, startDate, endDate],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      let query = supabase
        .from('user_training_progress')
        .select(`
          *,
          users!inner(
            id,
            name,
            email,
            organization_id
          ),
          training_modules!inner(
            id,
            title,
            content_type,
            video_url,
            video_source,
            training_courses!inner(
              id,
              title,
              organization_id
            )
          )
        `)
        .eq('users.organization_id', user.organizationId)
        .eq('training_modules.training_courses.organization_id', user.organizationId)
        .gt('video_progress_percentage', 0)
        .order('updated_at', { ascending: false });

      if (startDate) {
        query = query.gte('updated_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('updated_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId
  });
};

export default {
  useVideoProgress,
  useAllVideoProgress,
  useUpdateVideoProgress,
  useCompleteModule,
  useVideoEngagementAnalytics
};