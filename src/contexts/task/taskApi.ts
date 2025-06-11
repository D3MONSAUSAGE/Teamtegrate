
import { User, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Fetch tasks for a user including tasks from accessible projects
export const fetchUserTasks = async (
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  if (!user) {
    setTasks([]);
    return;
  }

  try {
    console.log('🚀 Fetching tasks for user:', user.id);
    
    // First, get all projects the user has access to (same logic as useProjects)
    const [allProjectsResult, teamMembershipsResult] = await Promise.all([
      supabase
        .from('projects')
        .select('id, manager_id, team_members')
        .order('created_at', { ascending: false }),
      supabase
        .from('project_team_members')
        .select('project_id')
        .eq('user_id', user.id)
    ]);
    
    if (allProjectsResult.error) {
      console.error('❌ Error fetching projects for task access:', allProjectsResult.error);
    }
    
    if (teamMembershipsResult.error) {
      console.warn('⚠️ Error fetching team memberships for task access:', teamMembershipsResult.error);
    }
    
    const allProjects = allProjectsResult.data || [];
    const teamMemberships = teamMembershipsResult.data?.map(tm => tm.project_id) || [];
    
    // Filter projects where user has access using the same logic as useProjects
    const accessibleProjectIds = allProjects
      .filter(project => {
        const isManager = String(project.manager_id) === String(user.id);
        const isTeamMemberFromArray = Array.isArray(project.team_members) && 
          project.team_members.some(memberId => String(memberId) === String(user.id));
        const isTeamMemberFromTable = teamMemberships.includes(project.id);
        
        return isManager || isTeamMemberFromArray || isTeamMemberFromTable;
      })
      .map(project => project.id);
    
    console.log(`📊 User has access to ${accessibleProjectIds.length} projects:`, accessibleProjectIds);
    
    // Build the query to include tasks from accessible projects
    let taskQuery = supabase.from('tasks').select('*');
    
    // Create OR conditions for task access
    const orConditions = [
      `user_id.eq.${user.id}`,
      `assigned_to_id.eq.${user.id}`,
      `assigned_to_ids.cs.{${user.id}}`
    ];
    
    // Add accessible projects to the query
    if (accessibleProjectIds.length > 0) {
      orConditions.push(`project_id.in.(${accessibleProjectIds.join(',')})`);
    }
    
    const { data: taskData, error } = await taskQuery.or(orConditions.join(','));

    if (error) {
      console.error('❌ Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`📊 Fetched ${taskData.length} tasks from database`);

    const parseDate = (dateStr: string | null): Date => {
      if (!dateStr) return new Date();
      return new Date(dateStr);
    };

    // Get all user IDs that are assigned to tasks to fetch their names
    const assignedUserIds = taskData
      .filter(task => task.assigned_to_id)
      .map(task => task.assigned_to_id);

    // Remove duplicates
    const uniqueUserIds = [...new Set(assignedUserIds)];
    
    // Fetch user names for assigned users
    let userMap = new Map();
    if (uniqueUserIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', uniqueUserIds);

      if (userError) {
        console.error('❌ Error fetching user data for task assignments:', userError);
      } else if (userData) {
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
      }
    }

    // Map tasks with their assigned user names
    const tasks: Task[] = taskData.map((task) => {
      // Get the assigned user name from our map
      const assignedUserName = task.assigned_to_id ? userMap.get(task.assigned_to_id) : undefined;

      return {
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: parseDate(task.deadline),
        priority: (task.priority as Task['priority']) || 'Medium',
        status: (task.status || 'To Do') as Task['status'],
        createdAt: parseDate(task.created_at),
        updatedAt: parseDate(task.updated_at),
        completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
        assignedToName: assignedUserName,
        comments: [],
        cost: task.cost || 0
      };
    });

    console.log(`✅ Final task count being set: ${tasks.length}`);
    console.log(`📋 Tasks by project:`, tasks.reduce((acc, task) => {
      const projectId = task.projectId || 'No Project';
      acc[projectId] = (acc[projectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    
    setTasks(tasks);
  } catch (error) {
    console.error('❌ Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
