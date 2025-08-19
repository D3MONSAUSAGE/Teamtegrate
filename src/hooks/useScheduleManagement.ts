import { useState, useEffect } from 'react';
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

export interface ShiftTemplate {
  id: string;
  organization_id: string;
  template_id?: string;
  name: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  max_employees: number;
  min_employees: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSchedule {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_template_id: string;
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
  shift_template?: ShiftTemplate;
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
  const { user } = useAuth();
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);
  const [employeeAvailability, setEmployeeAvailability] = useState<EmployeeAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch shift templates
  const fetchShiftTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShiftTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shift templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch employee schedules for a date range
  const fetchEmployeeSchedules = async (startDate: string, endDate: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employee_schedules')
        .select(`
          *,
          shift_template:shift_templates(*),
          employee:users!employee_id(id, name, email)
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      setEmployeeSchedules(data || []);
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

  // Create shift template
  const createShiftTemplate = async (template: Omit<ShiftTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shift_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      setShiftTemplates(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shift template');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create employee schedule
  const createEmployeeSchedule = async (schedule: Omit<EmployeeSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert([schedule])
        .select()
        .single();

      if (error) throw error;
      // Refresh schedules to get updated data with joins
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee schedule');
      throw err;
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
      fetchShiftTemplates();
    }
  }, [user]);

  return {
    scheduleTemplates,
    shiftTemplates,
    employeeSchedules,
    employeeAvailability,
    isLoading,
    error,
    fetchScheduleTemplates,
    fetchShiftTemplates,
    fetchEmployeeSchedules,
    fetchEmployeeAvailability,
    createScheduleTemplate,
    createShiftTemplate,
    createEmployeeSchedule,
    updateEmployeeSchedule,
    setEmployeeAvailabilityData
  };
};