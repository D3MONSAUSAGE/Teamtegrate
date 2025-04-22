
import { User, Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { fetchTeamMemberName } from './team';
import { fetchTaskComments } from './comments';

export const fetchProjects = async (user: User | null, setProjects: React.Dispatch<React.SetStateAction<Project[]>>) => {
  try {
    if (!user) return;
    
    // First, get projects where user is the manager
    const { data: managedProjects, error: managedError } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id);
    
    if (managedError) {
      console.error('Error fetching managed projects:', managedError);
      toast.error('Failed to load projects');
      return;
    }
    
    // Then get team_member entries for this user to find projects they're assigned to
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('email', user.email);
      
    if (memberError) {
      console.error('Error fetching team member status:', memberError);
    }
    
    // Check if user is a team member
    const isTeamMember = memberData && memberData.length > 0;
    let assignedProjects: any[] = [];
    
    // If user is a team member, get projects they're assigned to
    if (isTeamMember) {
      const { data: teamMemberProjects, error: teamProjectsError } = await supabase
        .from('projects')
        .select('*');
        
      if (teamProjectsError) {
        console.error('Error fetching team member projects:', teamProjectsError);
      } else if (teamMemberProjects) {
        assignedProjects = teamMemberProjects;
      }
    }
    
    // Combine all projects (managed + assigned)
    let allProjectsData = [...(managedProjects || [])];
    
    // Add assigned projects that aren't already included (as manager)
    if (assignedProjects.length > 0) {
      assignedProjects.forEach(project => {
        // Check if this project is already in the list (user is both manager and team member)
        const exists = allProjectsData.some(p => p.id === project.id);
        if (!exists) {
          allProjectsData.push(project);
        }
      });
    }
    
    if (allProjectsData.length === 0) {
      setProjects([]);
      return;
    }
    
    // First get all tasks that belong to any project to avoid multiple queries
    const { data: allProjectTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', allProjectsData.map(project => project.id));
    
    if (tasksError) {
      console.error('Error fetching project tasks:', tasksError);
    }
    
    // Group tasks by project_id for more efficient lookup
    const tasksByProject: Record<string, any[]> = {};
    if (allProjectTasks) {
      allProjectTasks.forEach(task => {
        if (task.project_id) {
          if (!tasksByProject[task.project_id]) {
            tasksByProject[task.project_id] = [];
          }
          tasksByProject[task.project_id].push(task);
        }
      });
    }
    
    const formattedProjects = await Promise.all(allProjectsData.map(async (project) => {
      // Get tasks for this specific project
      const projectTasks = tasksByProject[project.id] || [];
      
      const formattedProjectTasks = await Promise.all(projectTasks.map(async (task) => {
        // For each task, fetch its comments
        const comments = await fetchTaskComments(task.id);

        // Get assignee name if available
        let assigneeName;
        if (task.assigned_to_id) {
          assigneeName = await fetchTeamMemberName(task.assigned_to_id);
        }
        
        const formattedTask: Task = {
          id: task.id,
          userId: task.user_id || user.id, // Default to current user if null
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
          // Use user info since completed_by_id isn't available
          completedById: user.id,
          completedByName: user.name,
          comments: comments || [],
          tags: [], // Initialize as empty array
          cost: task.cost || 0,
        };
        return formattedTask;
      }));
      
      // Determine project status based on is_completed flag or default to "In Progress"
      let projectStatus: 'To Do' | 'In Progress' | 'Completed' = 'In Progress';
      if (project.is_completed) {
        projectStatus = 'Completed';
      } else if (projectTasks.length === 0) {
        projectStatus = 'To Do';
      }
      
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
        is_completed: project.is_completed || false,
        status: projectStatus, // Add project status
      };
    }));
    
    setProjects(formattedProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
  }
};
