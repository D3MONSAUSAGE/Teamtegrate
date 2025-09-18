import { useEffect } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types';

export const useTaskSync = () => {
  const { user } = useAuth();
  const { isConnected, syncTask } = useGoogleCalendar();

  // Auto-sync tasks when they are created or updated
  const syncTaskToCalendar = async (task: Task, action: 'create' | 'update' | 'delete' = 'create') => {
    if (!isConnected || !user) return;

    try {
      // Get user's sync preferences
      const { data: preferences } = await supabase
        .from('google_calendar_sync_preferences')
        .select('sync_tasks, sync_task_deadlines, sync_focus_time, sync_task_reminders')
        .eq('user_id', user.id)
        .single();

      if (!preferences?.sync_tasks) return;

      // Sync different types based on preferences
      const syncPromises = [];

      if (preferences.sync_task_deadlines && task.deadline) {
        syncPromises.push(syncTask(task.id, action, 'deadline'));
      }

      if (preferences.sync_focus_time && task.priority === 'High') {
        syncPromises.push(syncTask(task.id, action, 'focus_time'));
      }

      if (preferences.sync_task_reminders && task.deadline) {
        syncPromises.push(syncTask(task.id, action, 'reminder'));
      }

      // Execute all syncs
      await Promise.allSettled(syncPromises);
    } catch (error) {
      console.error('Failed to sync task to Google Calendar:', error);
    }
  };

  // Listen for task changes and automatically sync
  useEffect(() => {
    if (!user || !isConnected) return;

    const channel = supabase
      .channel('task-sync-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const task = payload.new as Task;
          await syncTaskToCalendar(task, 'create');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const task = payload.new as Task;
          const oldTask = payload.old as Task;
          
          // Check if the task was marked as completed
          if (task.status === 'Completed' && oldTask.status !== 'Completed') {
            // Delete calendar events when task is completed
            await syncTaskToCalendar(task, 'delete');
          } else if (task.status !== 'Completed') {
            // Update calendar events for active tasks
            await syncTaskToCalendar(task, 'update');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const task = payload.old as Task;
          await syncTaskToCalendar(task, 'delete');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isConnected, syncTask]);

  return {
    syncTaskToCalendar,
    isConnected,
  };
};