
import { Project, Task, TaskPriority, TaskStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert Supabase date strings to Date objects
const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    // Fetch projects user is manager of
    let { data: managerProjects, error: managerError } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id);

    if (managerError) {
      console.error('Error fetching manager projects:', managerError);
      toast.error('Failed to load projects');
      managerProjects = [];
    }

    // Fetch project IDs where user is a project_team_member
    const { data: memberLinks, error: memberLinksError } = await supabase
      .from('project_team_members')
      .select('project_id')
      .eq('user_id', user.id);

    if (memberLinksError) {
      console.error('Error fetching team member projects:', memberLinksError);
      toast.error('Failed to load your team projects');
    }

    const teamProjectIds = (memberLinks || []).map(link => link.project_id);

    // Fetch those projects (avoid duplicating manager-owned ones)
    let memberProjects: any[] = [];
    if (teamProjectIds.length > 0) {
      // Remove any projects already fetched as manager
      const excludeIds = managerProjects ? managerProjects.map(p => p.id) : [];
      const filterIds = teamProjectIds.filter(pid => !excludeIds.includes(pid));
      if (filterIds.length > 0) {
        const { data: extraProjects, error: extraProjectsError } = await supabase
          .from('projects')
          .select('*')
          .in('id', filterIds);
        if (extraProjectsError) {
          console.error('Error fetching accessible team projects:', extraProjectsError);
        }
        memberProjects = extraProjects || [];
      }
    }

    // Combine all projects the user can access
    const projectData = [...(managerProjects || []), ...memberProjects];

    // Fetch tasks for these projects
    const projectIds = projectData.map(p => p.id);
    let taskData: any[] = [];
    if (projectIds.length > 0) {
      const { data: allTaskData, error: taskError } = await supabase
        .from('project_tasks')
        .select('*');
      if (taskError) {
        console.error('Error fetching project tasks:', taskError);
        toast.error('Failed to load project tasks');
      } else {
        taskData = allTaskData || [];
      }
    }
    
    // Fetch comments for all tasks
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*');

    if (commentError) {
      console.error('Error fetching comments:', commentError);
    }

    // Create userMap for comment user names
    const userMap = new Map();
    if (commentData && commentData.length > 0) {
      const userIds = [...new Set(commentData.map(comment => comment.user_id))];
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      if (!userError && userData) {
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
      }
    }

    const projects: Project[] = projectData.map(project => {
      // Get tasks that belong to this project
      const projectTasks = taskData
        .filter(task => task.project_id === project.id)
        .map(task => {
          // Find comments for this task
          const taskComments = commentData
            ? commentData
                .filter(comment => comment.task_id === task.id)
                .map(comment => ({
                  id: comment.id,
                  userId: comment.user_id,
                  userName: userMap.get(comment.user_id) || comment.user_id,
                  text: comment.content,
                  createdAt: parseDate(comment.created_at)
                }))
            : [];

          return {
            id: task.id,
            userId: task.assigned_to_id || user.id, // Using assigned_to_id instead of user_id
            projectId: project.id,
            title: task.title || '',
            description: task.description || '',
            deadline: parseDate(task.deadline),
            priority: (task.priority as TaskPriority) || 'Medium',
            status: (task.status || 'To Do') as TaskStatus, // Explicitly casting to TaskStatus
            createdAt: parseDate(task.created_at),
            updatedAt: parseDate(task.updated_at),
            completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
            assignedToId: task.assigned_to_id,
            assignedToName: task.assigned_to_id, // Using assigned_to_id since assigned_to_name doesn't exist
            comments: taskComments,
            cost: task.cost || 0
          };
        });

      return {
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: parseDate(project.start_date),
        endDate: parseDate(project.end_date),
        managerId: project.manager_id || user.id,
        tasks: projectTasks,
        createdAt: parseDate(project.created_at),
        updatedAt: parseDate(project.updated_at),
        budget: project.budget,
        budgetSpent: project.budget_spent,
        is_completed: project.is_completed
      };
    });

    setProjects(projects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
  }
};
