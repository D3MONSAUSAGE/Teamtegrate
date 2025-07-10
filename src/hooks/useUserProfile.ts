
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeProjects: number;
  completionRate: number;
}

interface ProjectInfo {
  id: string;
  title: string;
  status: string;
  is_completed: boolean;
}

interface ProfileData {
  user: UserProfile;
  tasks: Task[];
  projects: ProjectInfo[];
  stats: UserStats;
}

export const useUserProfile = (userId: string | null) => {
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canViewProfile = currentUser && ['superadmin', 'admin', 'manager'].includes(currentUser.role);

  useEffect(() => {
    if (userId && canViewProfile) {
      fetchUserProfile();
    }
  }, [userId, canViewProfile]);

  const fetchUserProfile = async () => {
    if (!userId || !canViewProfile) return;
    
    try {
      setLoading(true);
      setError(null);
      devLog.userOperation('Fetching user profile', { userId });

      // Fetch user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        setError('Failed to fetch user profile');
        logger.error('Error fetching user profile', userError);
        return;
      }

      // Fetch user tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksError) {
        logger.error('Error fetching tasks', tasksError);
      }

      // Fetch user projects (where they are manager or team member)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, status, is_completed')
        .or(`manager_id.eq.${userId},${userId}.in.(team_members)`);

      if (projectsError) {
        logger.error('Error fetching projects', projectsError);
      }

      const tasks: Task[] = tasksData?.map(task => ({
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title,
        description: task.description,
        deadline: new Date(task.deadline), // Convert string to Date
        priority: task.priority as 'Low' | 'Medium' | 'High',
        status: task.status as 'To Do' | 'In Progress' | 'Completed',
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at),
        assignedToIds: task.assigned_to_ids,
        assignedToNames: task.assigned_to_names,
        cost: task.cost,
        organizationId: task.organization_id,
        comments: []
      })) || [];

      const projects: ProjectInfo[] = projectsData || [];

      // Calculate stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'Completed').length;
      const overdueTasks = tasks.filter(task => 
        task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Completed'
      ).length;
      const activeProjects = projects.filter(p => !p.is_completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const stats: UserStats = {
        totalTasks,
        completedTasks,
        overdueTasks,
        activeProjects,
        completionRate
      };

      setProfileData({
        user: userProfile,
        tasks,
        projects,
        stats
      });

      devLog.userOperation('User profile fetched successfully', { 
        userId, 
        tasksCount: tasks.length, 
        projectsCount: projects.length 
      });

    } catch (error) {
      logger.error('Error in fetchUserProfile', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    profileData,
    loading,
    error,
    canViewProfile,
    refetch: fetchUserProfile
  };
};
