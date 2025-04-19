
import { User, Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { fetchTeamMemberName } from './team';
import { fetchTaskComments } from './comments';

export const fetchProjects = async (user: User | null, setProjects: React.Dispatch<React.SetStateAction<Project[]>>) => {
  try {
    if (!user) return;
    
    console.log('Fetching projects for user:', user.id);
    
    // First, fetch all projects
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id);
    
    if (projectError) {
      console.error('Error fetching projects:', projectError);
      toast.error('Failed to load projects');
      return;
    }
    
    if (!projectData || projectData.length === 0) {
      setProjects([]);
      return;
    }
    
    // Next, fetch all tasks for these projects in a single query for efficiency
    const projectIds = projectData.map(project => project.id);
    
    let tasksData = [];
    let tasksError = null;
    
    try {
      const result = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds);
      
      tasksData = result.data || [];
      tasksError = result.error;
    } catch (err) {
      console.error('Error fetching tasks for projects:', err);
      tasksError = err;
    }
    
    if (tasksError) {
      console.error('Error fetching tasks for projects:', tasksError);
      // Continue with empty tasks rather than failing completely
    }
    
    // Group tasks by project_id for easier assignment
    const tasksByProject: Record<string, any[]> = {};
    if (tasksData && tasksData.length > 0) {
      tasksData.forEach(task => {
        if (task.project_id) {
          if (!tasksByProject[task.project_id]) {
            tasksByProject[task.project_id] = [];
          }
          tasksByProject[task.project_id].push(task);
        }
      });
    }
    
    // Process each project and its tasks
    const formattedProjects = await Promise.all(projectData.map(async (project) => {
      const projectId = project.id;
      const projectTasksData = tasksByProject[projectId] || [];
      
      console.log(`Found ${projectTasksData.length} tasks for project ${projectId}:`, projectTasksData);
      
      // Process all tasks for this project
      const formattedProjectTasks = await Promise.all(projectTasksData.map(async (task) => {
        let comments = [];
        
        try {
          comments = await fetchTaskComments(task.id);
        } catch (error) {
          console.error(`Error fetching comments for task ${task.id}:`, error);
        }

        let assigneeName;
        try {
          if (task.assigned_to_id) {
            assigneeName = await fetchTeamMemberName(task.assigned_to_id);
          }
        } catch (error) {
          console.error(`Error fetching assignee name for task ${task.id}:`, error);
        }
        
        return {
          id: task.id,
          userId: task.user_id,
          projectId: task.project_id,
          title: task.title || '',
          description: task.description || '',
          deadline: new Date(task.deadline || Date.now()),
          priority: (task.priority as any) || 'Medium',
          status: (task.status as any) || 'To Do',
          createdAt: new Date(task.created_at || Date.now()),
          updatedAt: new Date(task.updated_at || Date.now()),
          completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
          assignedToId: task.assigned_to_id,
          assignedToName: assigneeName,
          completedById: user.id,
          completedByName: user.name,
          comments: comments || [],
          cost: task.cost || 0,
        };
      }));
      
      return {
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: new Date(project.start_date || Date.now()),
        endDate: new Date(project.end_date || Date.now()),
        managerId: project.manager_id || '',
        createdAt: new Date(project.created_at || Date.now()),
        updatedAt: new Date(project.updated_at || Date.now()),
        tasks: formattedProjectTasks,
        teamMembers: [],
        tags: [],
        budget: project.budget || 0,
        budgetSpent: project.budget_spent || 0,
        is_completed: project.is_completed !== undefined ? Boolean(project.is_completed) : false
      };
    }));
    
    setProjects(formattedProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
  }
};
