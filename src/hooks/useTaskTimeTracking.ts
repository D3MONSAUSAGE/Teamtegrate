
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TaskTimeEntry {
  id: string;
  user_id: string;
  task_id: string;
  clock_in: Date;
  clock_out?: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
  organization_id: string;
  paused_at?: Date;
  total_paused_duration?: string;
  is_paused?: boolean;
}

export interface TaskTimerState {
  activeTaskId?: string;
  activeTaskTitle?: string;
  startTime?: Date;
  elapsedSeconds: number;
  totalTimeToday: Record<string, number>; // taskId -> minutes
  isPaused: boolean;
  pausedAt?: Date;
}

interface ClockOutResult {
  success: boolean;
  entry_id?: string;
  task_id?: string;
  message: string;
}

interface PauseResumeResult {
  success: boolean;
  entry_id?: string;
  task_id?: string;
  message: string;
}

export const useTaskTimeTracking = () => {
  const { user } = useAuth();
  const [timerState, setTimerState] = useState<TaskTimerState>({
    elapsedSeconds: 0,
    totalTimeToday: {},
    isPaused: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Debug logging
  useEffect(() => {
    console.log('🕒 Timer state updated:', timerState);
  }, [timerState]);

  // Start timer updates
  useEffect(() => {
    if (timerState.activeTaskId && timerState.startTime && !timerState.isPaused) {
      console.log('⏰ Starting timer interval for task:', timerState.activeTaskId);
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const startTime = timerState.startTime!.getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        setTimerState(prev => ({
          ...prev,
          elapsedSeconds
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        console.log('⏹️ Clearing timer interval');
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState.activeTaskId, timerState.startTime, timerState.isPaused]);

  // Fetch current state and today's totals
  const fetchTaskTimeState = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user ID for fetching task time state');
      return;
    }

    console.log('🔄 Fetching task time state for user:', user.id);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get active task session (basic query until types are regenerated)
      const { data: activeSession, error: activeError } = await supabase
        .from('time_entries')
        .select(`
          id,
          user_id,
          task_id,
          clock_in,
          notes,
          organization_id
        `)
        .eq('user_id', user.id)
        .is('clock_out', null)
        .not('task_id', 'is', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError) {
        console.error('❌ Error fetching active session:', activeError);
        throw activeError;
      }

      console.log('📊 Active session:', activeSession);

      // Get today's totals per task
      const { data: todayEntries, error: todayError } = await supabase
        .from('time_entries')
        .select('task_id, duration_minutes')
        .eq('user_id', user.id)
        .gte('clock_in', today.toISOString())
        .not('task_id', 'is', null)
        .not('clock_out', 'is', null);

      if (todayError) {
        console.error('❌ Error fetching today entries:', todayError);
        throw todayError;
      }

      console.log('📈 Today entries:', todayEntries);

      // Calculate totals
      const totalTimeToday: Record<string, number> = {};
      todayEntries?.forEach(entry => {
        if (entry.task_id && entry.duration_minutes) {
          totalTimeToday[entry.task_id] = (totalTimeToday[entry.task_id] || 0) + entry.duration_minutes;
        }
      });

      console.log('📊 Total time today:', totalTimeToday);

      // Update state
      if (activeSession) {
        const startTime = new Date(activeSession.clock_in);
        const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
        
        // Get task title separately
        const { data: taskData } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', activeSession.task_id)
          .single();
        
        console.log('▶️ Setting active timer state:', {
          taskId: activeSession.task_id,
          title: taskData?.title,
          elapsedSeconds
        });
        
        setTimerState({
          activeTaskId: activeSession.task_id,
          activeTaskTitle: taskData?.title,
          startTime,
          elapsedSeconds,
          totalTimeToday,
          isPaused: false,
          pausedAt: undefined
        });
      } else {
        console.log('⏸️ No active session, setting empty state');
        setTimerState({
          elapsedSeconds: 0,
          totalTimeToday,
          isPaused: false
        });
      }
    } catch (error) {
      console.error('❌ Error fetching task time state:', error);
      toast.error('Failed to load timer state');
    }
  }, [user?.id]);

  // Start working on a task
  const startTaskWork = useCallback(async (taskId: string, taskTitle: string) => {
    if (!user?.organizationId || isLoading) {
      console.log('❌ Cannot start task work - no org ID or loading');
      return;
    }

    console.log('▶️ Starting work on task:', { taskId, taskTitle });

    try {
      setIsLoading(true);

      // Stop any existing active session first
      if (timerState.activeTaskId) {
        console.log('⏸️ Stopping existing active session');
        await stopTaskWork();
        // Small delay to ensure the stop operation completes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          organization_id: user.organizationId,
          task_id: taskId,
          notes: `Working on: ${taskTitle}`
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error starting task work:', error);
        throw error;
      }

      console.log('✅ Started task work:', data);

      const startTime = new Date(data.clock_in);
      setTimerState(prev => ({
        ...prev,
        activeTaskId: taskId,
        activeTaskTitle: taskTitle,
        startTime,
        elapsedSeconds: 0,
        isPaused: false,
        pausedAt: undefined
      }));

      toast.success(`Started working on "${taskTitle}"`);
    } catch (error) {
      console.error('❌ Error starting task work:', error);
      toast.error('Failed to start task timer');
      // Reset state on error
      setTimerState(prev => ({
        ...prev,
        activeTaskId: undefined,
        activeTaskTitle: undefined,
        startTime: undefined,
        elapsedSeconds: 0,
        isPaused: false,
        pausedAt: undefined
      }));
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, timerState.activeTaskId]);

  // Stop working on current task
  const stopTaskWork = useCallback(async () => {
    if (!user?.id || isLoading) {
      console.log('❌ Cannot stop task work - no user or loading');
      return;
    }

    console.log('⏹️ Stopping work on task:', timerState.activeTaskId);

    try {
      setIsLoading(true);

      const { data: result, error } = await supabase.rpc('update_time_entry_clock_out', {
        p_user_id: user.id,
        p_task_id: timerState.activeTaskId || null
      }) as { data: ClockOutResult | null; error: any };

      if (error) {
        console.error('❌ Error stopping task work:', error);
        throw error;
      }

      console.log('✅ Clock out result:', result);

      if (result?.success) {
        toast.success(`Stopped working on "${timerState.activeTaskTitle || 'task'}"`);
        
        // Reset timer state immediately
        setTimerState(prev => ({
          ...prev,
          activeTaskId: undefined,
          activeTaskTitle: undefined,
          startTime: undefined,
          elapsedSeconds: 0,
          isPaused: false,
          pausedAt: undefined
        }));
        
        // Refresh state to get updated totals
        await fetchTaskTimeState();
      } else {
        console.warn('⚠️ No active time entry found, syncing state...');
        toast.info('Timer state synchronized');
        await fetchTaskTimeState();
      }
    } catch (error) {
      console.error('❌ Error stopping task work:', error);
      toast.error('Failed to stop task timer');
      await fetchTaskTimeState();
    } finally {
      setIsLoading(false);
    }
  }, [timerState.activeTaskId, timerState.activeTaskTitle, user, isLoading, fetchTaskTimeState]);

  // Pause current task work (temporary local state until RPC functions are available)
  const pauseTaskWork = useCallback(async () => {
    if (!user?.id || isLoading || !timerState.activeTaskId || timerState.isPaused) {
      console.log('❌ Cannot pause task work - no user, loading, no active task, or already paused');
      return;
    }

    console.log('⏸️ Pausing work on task:', timerState.activeTaskId);

    try {
      setIsLoading(true);
      
      // For now, just update local state until RPC functions are properly typed
      setTimerState(prev => ({
        ...prev,
        isPaused: true,
        pausedAt: new Date()
      }));
      
      toast.success(`Paused working on "${timerState.activeTaskTitle || 'task'}"`);
    } catch (error) {
      console.error('❌ Error pausing task work:', error);
      toast.error('Failed to pause task timer');
    } finally {
      setIsLoading(false);
    }
  }, [timerState.activeTaskId, timerState.activeTaskTitle, timerState.isPaused, user, isLoading]);

  // Resume current task work (temporary local state until RPC functions are available)
  const resumeTaskWork = useCallback(async () => {
    if (!user?.id || isLoading || !timerState.activeTaskId || !timerState.isPaused) {
      console.log('❌ Cannot resume task work - no user, loading, no active task, or not paused');
      return;
    }

    console.log('▶️ Resuming work on task:', timerState.activeTaskId);

    try {
      setIsLoading(true);
      
      // For now, just update local state until RPC functions are properly typed
      setTimerState(prev => ({
        ...prev,
        isPaused: false,
        pausedAt: undefined
      }));
      
      toast.success(`Resumed working on "${timerState.activeTaskTitle || 'task'}"`);
    } catch (error) {
      console.error('❌ Error resuming task work:', error);
      toast.error('Failed to resume task timer');
    } finally {
      setIsLoading(false);
    }
  }, [timerState.activeTaskId, timerState.activeTaskTitle, timerState.isPaused, user, isLoading]);

  // Get total time for a specific task today
  const getTaskTotalTime = useCallback((taskId: string): number => {
    let total = timerState.totalTimeToday[taskId] || 0;
    
    // Add current session time if this task is active
    if (timerState.activeTaskId === taskId) {
      total += Math.floor(timerState.elapsedSeconds / 60);
    }
    
    return total;
  }, [timerState.totalTimeToday, timerState.activeTaskId, timerState.elapsedSeconds]);

  // Initialize on mount
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Initializing task time tracking for user:', user.id);
      fetchTaskTimeState();
    }
  }, [user?.id, fetchTaskTimeState]);

  return {
    timerState,
    isLoading,
    startTaskWork,
    stopTaskWork,
    pauseTaskWork,
    resumeTaskWork,
    getTaskTotalTime,
    refreshState: fetchTaskTimeState
  };
};
