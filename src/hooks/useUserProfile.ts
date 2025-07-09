
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types/tasks';
import { toast } from 'sonner';

interface UserProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    avatar_url?: string;
  };
  tasks: Task[];
  projects: Array<{
    id: string;
    title: string;
    status: string;
    manager_id: string;
    is_manager: boolean;
    is_team_member: boolean;
  }>;
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    activeProjects: number;
    completionRate: number;
  };
}

export const useUserProfile = (targetUserId: string | null) => {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const canViewProfile = () => {
    if (!currentUser) return false;
    return ['manager', 'admin', 'superadmin'].includes(currentUser.role);
  };

  const fetchUserProfile = async (userId: string) => {
    if (!canViewProfile()) {
      setError('Insufficient permissions to view user profiles');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, avatar_url')
        .eq('id', userId)
        .eq('organization_id', currentUser?.organizationId)
        .single();

      if (userError) throw userError;

      // Fetch user's tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', currentUser?.organizationId)
        .or(`user_id.eq.${userId},assigned_to_id.eq.${userId},assigned_to_ids.cs.{${userId}}`);

      if (tasksError) throw tasksError;

      // Transform tasks to app format
      const transformedTasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        deadline: new Date(task.deadline || new Date()),
        priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
        status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
        createdAt: new Date(task.created_at || new Date()),
        updatedAt: new Date(task.updated_at || new Date()),
        assignedToId: task.assigned_to_id,
        assignedToIds: task.assigned_to_ids || [],
        assignedToNames: task.assigned_to_names || [],
        cost: Number(task.cost) || 0,
        organizationId: task.organization_id,
        comments: []
      }));

      // Fetch user's projects (as manager)
      const { data: managedProjects, error: managedError } = await supabase
        .from('projects')
        .select('id, title, status, manager_id')
        .eq('manager_id', userId)
        .eq('organization_id', currentUser?.organizationId);

      if (managedError) throw managedError;

      // Fetch projects where user is team member
      const { data: memberProjects, error: memberError } = await supabase
        .from('projects')
        .select('id, title, status, manager_id, team_members')
        .eq('organization_id', currentUser?.organizationId)
        .contains('team_members', [userId]);

      if (memberError) throw memberError;

      // Combine and deduplicate projects
      const allProjects = [
        ...(managedProjects || []).map(p => ({
          ...p,
          is_manager: true,
          is_team_member: false
        })),
        ...(memberProjects || [])
          .filter(p => p.manager_id !== userId)
          .map(p => ({
            ...p,
            is_manager: false,
            is_team_member: true
          }))
      ];

      // Calculate stats
      const totalTasks = transformedTasks.length;
      const completedTasks = transformedTasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = transformedTasks.filter(t => 
        t.status !== 'Completed' && new Date(t.deadline) < new Date()
      ).length;
      const activeProjects = allProjects.filter(p => p.status !== 'Completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setProfileData({
        user: userData,
        tasks: transformedTasks,
        projects: allProjects,
        stats: {
          totalTasks,
          completedTasks,
          overdueTasks,
          activeProjects,
          completionRate
        }
      });
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to fetch user profile');
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId && canViewProfile()) {
      fetchUserProfile(targetUserId);
    } else if (targetUserId && !canViewProfile()) {
      setError('Insufficient permissions to view user profiles');
    }
  }, [targetUserId, currentUser]);

  return {
    profileData,
    loading,
    error,
    canViewProfile: canViewProfile(),
    refetch: () => targetUserId && fetchUserProfile(targetUserId)
  };
};
