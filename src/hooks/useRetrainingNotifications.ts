import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';

export interface RetrainingSettings {
  id: string;
  organization_id: string;
  course_id: string;
  retraining_interval_months: number;
  warning_period_days: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RetrainingNotification {
  id: string;
  organization_id: string;
  user_id: string;
  course_id: string;
  assignment_id?: string;
  notification_type: 'warning' | 'overdue' | 'escalation';
  sent_at: string;
  escalation_level: number;
  created_at: string;
}

export const useRetrainingNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RetrainingSettings[]>([]);
  const [notifications, setNotifications] = useState<RetrainingNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch retraining settings
  const fetchRetrainingSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_retraining_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching retraining settings:', err);
      setError('Failed to load retraining settings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch retraining notifications
  const fetchRetrainingNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('training_retraining_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []).map(item => ({
        ...item,
        notification_type: item.notification_type as 'warning' | 'overdue' | 'escalation'
      })));
    } catch (err) {
      console.error('Error fetching retraining notifications:', err);
      setError('Failed to load retraining notifications');
    }
  };

  // Create or update retraining settings
  const saveRetrainingSettings = async (
    courseId: string,
    intervalMonths: number,
    warningDays: number,
    isActive: boolean = true
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      // Check if settings already exist for this course
      const { data: existing } = await supabase
        .from('training_retraining_settings')
        .select('id')
        .eq('course_id', courseId)
        .single();

      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('training_retraining_settings')
          .update({
            retraining_interval_months: intervalMonths,
            warning_period_days: warningDays,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        await fetchRetrainingSettings();
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('training_retraining_settings')
          .insert([{
            organization_id: user.organizationId,
            course_id: courseId,
            retraining_interval_months: intervalMonths,
            warning_period_days: warningDays,
            is_active: isActive,
            created_by: user.id
          }])
          .select()
          .single();

        if (error) throw error;
        await fetchRetrainingSettings();
        return data;
      }
    } catch (err) {
      console.error('Error saving retraining settings:', err);
      setError('Failed to save retraining settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete retraining settings
  const deleteRetrainingSettings = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('training_retraining_settings')
        .delete()
        .eq('course_id', courseId);

      if (error) throw error;
      await fetchRetrainingSettings();
    } catch (err) {
      console.error('Error deleting retraining settings:', err);
      setError('Failed to delete retraining settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get retraining settings for a specific course
  const getRetrainingSettingsForCourse = (courseId: string) => {
    return settings.find(setting => setting.course_id === courseId);
  };

  // Get upcoming retraining assignments
  const getUpcomingRetraining = async () => {
    try {
      const { data, error } = await supabase
        .from('training_assignments')
        .select(`
          *,
          training_courses!content_id (
            title,
            description
          )
        `)
        .eq('is_retraining', true)
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching upcoming retraining:', err);
      return [];
    }
  };

  // Manually trigger retraining check
  const triggerRetrainingCheck = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the database function to check and create retraining assignments
      const { error } = await supabase.rpc('check_and_create_retraining_assignments');

      if (error) throw error;
      
      await fetchRetrainingNotifications();
      return { success: true };
    } catch (err) {
      console.error('Error triggering retraining check:', err);
      setError('Failed to trigger retraining check');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRetrainingSettings();
      fetchRetrainingNotifications();
    }
  }, [user]);

  return {
    settings,
    notifications,
    loading,
    error,
    fetchRetrainingSettings,
    fetchRetrainingNotifications,
    saveRetrainingSettings,
    deleteRetrainingSettings,
    getRetrainingSettingsForCourse,
    getUpcomingRetraining,
    triggerRetrainingCheck
  };
};