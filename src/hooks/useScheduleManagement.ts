import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';
import { toast } from 'sonner';

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
  team_id?: string | null;
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
  team?: {
    id: string;
    name: string;
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
  const { teams } = useTeamQueries();
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);
  const [employeeAvailability, setEmployeeAvailability] = useState<EmployeeAvailability[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRangeRef = useRef<{ start: string; end: string; includeAll: boolean; teamId?: string } | null>(null);
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
  const fetchEmployeeSchedules = async (startDate: string, endDate: string, includeAll: boolean = false, teamId?: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Remember last requested range for realtime refresh
      lastRangeRef.current = { start: startDate, end: endDate, includeAll, teamId };

      let query = supabase
        .from('employee_schedules')
        .select(`
          *,
          users!employee_id (
            id,
            name,
            email
          ),
          teams!team_id (
            id,
            name
          )
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_start_time', { ascending: true });

      // Apply team filtering if specified
      if (teamId && teamId !== 'all') {
        query = query.eq('team_id', teamId);
      }

      // Role-based access control is now handled by RLS policies
      // Users will only see schedules they have permission to see

      const { data, error } = await query;

      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast.error(`Database error: ${error.message}`);
        throw error;
      }
      
      setEmployeeSchedules(data || []);
    } catch (err) {
      console.error('Fetch employee schedules error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee schedules';
      console.error('Detailed fetch error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to fetch schedules: ${errorMessage}`);
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
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('Creating employee schedule with data:', schedule);
      
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert([{
          ...schedule,
          organization_id: user.organizationId,
          created_by: user.id
        }])
        .select(`
          *,
          users!employee_id (
            id,
            name,
            email
          ),
          teams!team_id (
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error creating schedule:', error);
        throw new Error(error.message || 'Failed to create employee schedule');
      }
      
      console.log('Successfully created schedule:', data);
      
      // Refresh schedules list
      const lastRange = lastRangeRef.current;
      if (lastRange) {
        await fetchEmployeeSchedules(lastRange.start, lastRange.end, lastRange.includeAll, lastRange.teamId);
      }
      
      toast.success('Employee schedule created successfully');
      return data;
    } catch (err) {
      console.error('Error in createEmployeeSchedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee schedule';
      setError(errorMessage);
      toast.error('Failed to create employee schedule');
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
            fetchEmployeeSchedules(last.start, last.end, last.includeAll, last.teamId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Team-specific query functions
  const fetchTeamSchedules = async (teamId: string, startDate: string, endDate: string) => {
    return fetchEmployeeSchedules(startDate, endDate, false, teamId);
  };

  const fetchManagerTeamSchedules = async (startDate: string, endDate: string) => {
    // RLS policies will automatically filter to show only teams the manager manages
    return fetchEmployeeSchedules(startDate, endDate, false);
  };

  const getUserAccessibleTeams = () => {
    if (!user || !teams) return [];
    
    // Admins and superadmins can see all teams
    if (user.role === 'admin' || user.role === 'superadmin') {
      return teams;
    }
    
    // Managers can see teams they manage (will be filtered by backend)
    if (user.role === 'manager') {
      return teams;
    }
    
    // Regular users don't get team selection
    return [];
  };

  return {
    scheduleTemplates,
    employeeSchedules,
    employeeAvailability,
    selectedTeamId,
    setSelectedTeamId,
    teams: getUserAccessibleTeams(),
    isLoading,
    error,
    fetchScheduleTemplates,
    fetchEmployeeSchedules,
    fetchEmployeeAvailability,
    fetchTeamSchedules,
    fetchManagerTeamSchedules,
    createScheduleTemplate,
    createEmployeeSchedule,
    updateEmployeeSchedule,
    setEmployeeAvailabilityData
  };
};