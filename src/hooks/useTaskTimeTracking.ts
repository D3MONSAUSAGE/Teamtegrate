
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
}

export interface TaskTimerState {
  activeTaskId?: string;
  activeTaskTitle?: string;
  startTime?: Date;
  elapsedSeconds: number;
  totalTimeToday: Record<string, number>; // taskId -> minutes
}

export const useTaskTimeTracking = () => {
  const { user } = useAuth();
  const [timerState, setTimerState] = useState<TaskTimerState>({
    elapsedSeconds: 0,
    totalTimeToday: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Start timer updates
  useEffect(() => {
    if (timerState.activeTaskId && timerState.startTime) {
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
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState.activeTaskId, timerState.startTime]);

  // Fetch current state and today's totals
  const fetchTaskTimeState = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get active task session
      const { data: activeSession, error: activeError } = await supabase
        .from('time_entries')
        .select(`
          id,
          user_id,
          task_id,
          clock_in,
          notes,
          organization_id,
          tasks!inner(title)
        `)
        .eq('user_id', user.id)
        .is('clock_out', null)
        .is_not('task_id', null)
        .maybeSingle();

      if (activeError) throw activeError;

      // Get today's totals per task
      const { data: todayEntries, error: todayError } = await supabase
        .from('time_entries')
        .select('task_id, duration_minutes')
        .eq('user_id', user.id)
        .gte('clock_in', today.toISOString())
        .is_not('task_id', null)
        .is_not('clock_out', null);

      if (todayError) throw todayError;

      // Calculate totals
      const totalTimeToday: Record<string, number> = {};
      todayEntries?.forEach(entry => {
        if (entry.task_id && entry.duration_minutes) {
          totalTimeToday[entry.task_id] = (totalTimeToday[entry.task_id] || 0) + entry.duration_minutes;
        }
      });

      // Update state
      if (activeSession) {
        const startTime = new Date(activeSession.clock_in);
        const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
        
        setTimerState({
          activeTaskId: activeSession.task_id,
          activeTaskTitle: (activeSession.tasks as any)?.title,
          startTime,
          elapsedSeconds,
          totalTimeToday
        });
      } else {
        setTimerState({
          elapsedSeconds: 0,
          totalTimeToday
        });
      }
    } catch (error) {
      console.error('Error fetching task time state:', error);
    }
  }, [user?.id]);

  // Start working on a task
  const startTaskWork = useCallback(async (taskId: string, taskTitle: string) => {
    if (!user?.organizationId || isLoading) return;

    try {
      setIsLoading(true);

      // Stop any existing active session
      if (timerState.activeTaskId) {
        await stopTaskWork();
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

      if (error) throw error;

      const startTime = new Date(data.clock_in);
      setTimerState(prev => ({
        ...prev,
        activeTaskId: taskId,
        activeTaskTitle: taskTitle,
        startTime,
        elapsedSeconds: 0
      }));

      toast.success(`Started working on "${taskTitle}"`);
    } catch (error) {
      console.error('Error starting task work:', error);
      toast.error('Failed to start task timer');
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, timerState.activeTaskId]);

  // Stop working on current task
  const stopTaskWork = useCallback(async () => {
    if (!timerState.activeTaskId || isLoading) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: new Date().toISOString()
        })
        .eq('user_id', user!.id)
        .eq('task_id', timerState.activeTaskId)
        .is('clock_out', null);

      if (error) throw error;

      toast.success(`Stopped working on "${timerState.activeTaskTitle}"`);
      
      // Refresh state to get updated totals
      await fetchTaskTimeState();
    } catch (error) {
      console.error('Error stopping task work:', error);
      toast.error('Failed to stop task timer');
    } finally {
      setIsLoading(false);
    }
  }, [timerState.activeTaskId, timerState.activeTaskTitle, user, isLoading, fetchTaskTimeState]);

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
      fetchTaskTimeState();
    }
  }, [user?.id, fetchTaskTimeState]);

  return {
    timerState,
    isLoading,
    startTaskWork,
    stopTaskWork,
    getTaskTotalTime,
    refreshState: fetchTaskTimeState
  };
};
