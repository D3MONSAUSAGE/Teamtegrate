import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ScheduleTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}


export interface EmployeeSchedule {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_template_id?: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  status: string;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface EmployeeAvailability {
  id: string;
  organization_id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  effective_from: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
}

export const useScheduleManagement = () => {
  const { user, hasRoleAccess } = useAuth();
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
  
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);
  const [employeeAvailability, setEmployeeAvailability] = useState<EmployeeAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRangeRef = useRef<{ start: string; end: string; includeAll: boolean } | null>(null);
  // Fetch schedule templates
  const fetchScheduleTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('schedule_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduleTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule templates');
    } finally {
      setIsLoading(false);
    }
  };


  // Fetch employee schedules for a date range
  const fetchEmployeeSchedules = async (startDate: string, endDate: string, includeAll: boolean = false) => {
    try {
      setIsLoading(true);
      // Remember last requested range for realtime refresh
      lastRangeRef.current = { start: startDate, end: endDate, includeAll };

      let query = supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:users!employee_id(id, name, email)
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_start_time', { ascending: true });

      // If not a manager/admin and not explicitly requesting all, scope to current user
      if (!includeAll && !hasRoleAccess('manager') && user?.id) {
        query = query.eq('employee_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Ensure employee data is properly structured from JOIN query
      const schedulesWithEmployees = (data || []) as unknown as EmployeeSchedule[];
      
      setEmployeeSchedules(schedulesWithEmployees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee schedules');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch employee availability
  const fetchEmployeeAvailability = async (employeeId?: string) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('employee_availability')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployeeAvailability(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee availability');
    } finally {
      setIsLoading(false);
    }
  };

  // Create schedule template
  const createScheduleTemplate = async (template: Omit<ScheduleTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('schedule_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      setScheduleTemplates(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule template');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  // Create employee schedule
  const createEmployeeSchedule = async (schedule: Omit<EmployeeSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      console.log('Creating employee schedule with data:', schedule);
      
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert([schedule])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating schedule:', error);
        throw new Error(error.message || 'Failed to create employee schedule');
      }
      
      console.log('Successfully created schedule:', data);
      return data;
    } catch (err) {
      console.error('Error in createEmployeeSchedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee schedule';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update employee schedule (for actual times)
  const updateEmployeeSchedule = async (id: string, updates: Partial<EmployeeSchedule>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employee_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setEmployeeSchedules(prev => 
        prev.map(schedule => schedule.id === id ? { ...schedule, ...data } : schedule)
      );
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee schedule');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Set employee availability
  const setEmployeeAvailabilityData = async (availability: Omit<EmployeeAvailability, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      // Check if availability already exists for this employee and day
      const { data: existing } = await supabase
        .from('employee_availability')
        .select('id')
        .eq('employee_id', availability.employee_id)
        .eq('day_of_week', availability.day_of_week)
        .eq('effective_from', availability.effective_from)
        .single();

      if (existing) {
        // Update existing availability
        const { data, error } = await supabase
          .from('employee_availability')
          .update(availability)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        setEmployeeAvailability(prev => 
          prev.map(avail => avail.id === existing.id ? data : avail)
        );
        return data;
      } else {
        // Create new availability
        const { data, error } = await supabase
          .from('employee_availability')
          .insert([availability])
          .select()
          .single();

        if (error) throw error;
        setEmployeeAvailability(prev => [...prev, data]);
        return data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set employee availability');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchScheduleTemplates();
    }
  }, [user]);

  // Realtime refresh for schedules within last requested range
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('employee_schedules_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_schedules' },
        () => {
          const last = lastRangeRef.current;
          if (last) {
            fetchEmployeeSchedules(last.start, last.end, last.includeAll);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    scheduleTemplates,
    employeeSchedules,
    employeeAvailability,
    isLoading,
    error,
    fetchScheduleTemplates,
    fetchEmployeeSchedules,
    fetchEmployeeAvailability,
    createScheduleTemplate,
    createEmployeeSchedule,
    updateEmployeeSchedule,
    setEmployeeAvailabilityData
  };
};