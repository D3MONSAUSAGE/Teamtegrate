
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  organization_id: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline?: string;
  created_at: string;
  project_id?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  manager_id?: string;
  tasks_count: number;
  created_at: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
}

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out?: string;
  duration_minutes?: number;
  notes?: string;
}

interface ActivityTimelineItem {
  type: string;
  description: string;
  timestamp: string;
  details?: string;
}

interface PerformanceMetrics {
  completionRate: number;
  activeTasks: number;
  completedTasks: number;
  weeklyHours: number;
  monthlyHours: number;
  avgDailyHours: number;
  lastActivity?: string;
}

export const useEmployeeOverview = (userId: string | null) => {
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const fetchEmployeeData = async () => {
    if (!userId || !isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch employee basic info
      const { data: employeeData, error: employeeError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // Fetch employee tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(`user_id.eq.${userId},assigned_to_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch employee projects (as manager or team member)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_team_members!inner(user_id)
        `)
        .or(`manager_id.eq.${userId},project_team_members.user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch journal entries (admin access)
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (journalError) {
        console.warn('Could not fetch journal entries:', journalError);
        setJournalEntries([]);
      } else {
        setJournalEntries(journalData || []);
      }

      // Fetch time entries
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('clock_in', { ascending: false })
        .limit(30);

      if (timeError) {
        console.warn('Could not fetch time entries:', timeError);
        setTimeEntries([]);
      } else {
        setTimeEntries(timeData || []);
      }

      // Calculate performance metrics
      const completedTasks = tasksData?.filter(t => t.status === 'Completed').length || 0;
      const totalTasks = tasksData?.length || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const activeTasks = tasksData?.filter(t => t.status !== 'Completed').length || 0;

      // Calculate time metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      const weeklyMinutes = timeData?.filter(entry => 
        new Date(entry.clock_in) >= weekAgo && entry.duration_minutes
      ).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

      const monthlyMinutes = timeData?.filter(entry => 
        new Date(entry.clock_in) >= monthAgo && entry.duration_minutes
      ).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

      const weeklyHours = Math.round(weeklyMinutes / 60 * 10) / 10;
      const monthlyHours = Math.round(monthlyMinutes / 60 * 10) / 10;
      const avgDailyHours = Math.round((monthlyHours / 30) * 10) / 10;

      // Find last activity
      const lastActivity = [
        ...(tasksData || []).map(t => t.updated_at || t.created_at),
        ...(journalData || []).map(j => j.created_at),
        ...(timeData || []).map(t => t.clock_in)
      ].sort().reverse()[0];

      setPerformanceMetrics({
        completionRate,
        activeTasks,
        completedTasks,
        weeklyHours,
        monthlyHours,
        avgDailyHours,
        lastActivity
      });

      // Build activity timeline
      const activities: ActivityTimelineItem[] = [];
      
      // Add task activities
      tasksData?.forEach(task => {
        activities.push({
          type: 'task',
          description: `${task.status === 'Completed' ? 'Completed' : 'Working on'} task: ${task.title}`,
          timestamp: task.updated_at || task.created_at,
          details: task.status
        });
      });

      // Add journal activities
      journalData?.forEach(journal => {
        activities.push({
          type: 'journal',
          description: `Created journal entry: ${journal.title}`,
          timestamp: journal.created_at,
          details: journal.is_public ? 'Public' : 'Private'
        });
      });

      // Add time tracking activities
      timeData?.slice(0, 10).forEach(time => {
        activities.push({
          type: 'time',
          description: time.clock_out ? 'Completed work session' : 'Started work session',
          timestamp: time.clock_out || time.clock_in,
          details: time.duration_minutes ? `${Math.round(time.duration_minutes / 60 * 10) / 10}h` : 'Active'
        });
      });

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityTimeline(activities.slice(0, 20));

    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
    } finally {
      setIsLoading(false);
    }
  };

  const logAdminAccess = async (accessType: string) => {
    if (!userId || !currentUser) return;

    try {
      await supabase
        .from('admin_access_audit')
        .insert({
          admin_user_id: currentUser.id,
          target_user_id: userId,
          access_type: accessType,
          organization_id: currentUser.organizationId
        });
    } catch (err) {
      console.error('Failed to log admin access:', err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [userId, isAdmin]);

  return {
    employee,
    tasks,
    projects,
    journalEntries,
    timeEntries,
    activityTimeline,
    performanceMetrics,
    isLoading,
    error,
    logAdminAccess,
    refetch: fetchEmployeeData
  };
};
