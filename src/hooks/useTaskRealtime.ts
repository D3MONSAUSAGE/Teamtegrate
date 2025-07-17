
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useTaskRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.organizationId) return;

    console.log('🔄 useTaskRealtime: Setting up real-time subscription for tasks');

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${user.organizationId}`
        },
        (payload) => {
          console.log('📡 Task real-time update:', payload);
          
          // Invalidate all task-related queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['tasks-my-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
          
          // Also invalidate dashboard-specific queries
          queryClient.invalidateQueries({ 
            queryKey: ['personal-tasks', user.organizationId, user.id] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['tasks-my-tasks', user.organizationId, user.id] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 useTaskRealtime: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.organizationId, user?.id]);
};
