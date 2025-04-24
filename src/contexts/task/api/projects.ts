
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
    if (!user) {
      console.log('No user found, skipping project fetch');
      setProjects([]);
      return;
    }

    console.log('Fetching projects with simplified approach for user:', user.id);
    
    // Basic fetch of projects data
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*');

    if (projectError) {
      console.error('Error fetching projects:', projectError);
      toast.error('Failed to load projects');
      setProjects([]);
      return;
    }

    // If no projects, return empty array
    if (!projectData || projectData.length === 0) {
      console.log('No projects found');
      setProjects([]);
      return;
    }
    
    // Transform the data to match our expected Project type without additional queries
    const projects: Project[] = projectData.map(project => {
      return {
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: parseDate(project.start_date),
        endDate: parseDate(project.end_date),
        managerId: project.manager_id || user.id,
        tasks: [], // We'll load tasks separately if needed
        createdAt: parseDate(project.created_at),
        updatedAt: parseDate(project.updated_at),
        budget: project.budget || 0,
        budgetSpent: project.budget_spent || 0,
        is_completed: project.is_completed || false,
        teamMembers: [] // We'll load team members separately if needed
      };
    });

    console.log('Successfully fetched basic projects:', projects.length);
    
    // First update the state with the basic project data
    setProjects(projects);
    
    // Then try to fetch additional data in the background
    fetchAdditionalProjectData(projects, setProjects);
    
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    toast.error('Failed to load projects');
    setProjects([]);
  }
};

// Separate function to fetch additional project data after basic data is loaded
const fetchAdditionalProjectData = async (
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    const projectIds = projects.map(p => p.id);
    
    // Fetch tasks for these projects
    const { data: taskData, error: taskError } = await supabase
      .from('project_tasks')
      .select('*')
      .in('project_id', projectIds);
      
    if (taskError) {
      console.error('Error fetching project tasks:', taskError);
      return;
    }

    const tasksById = new Map<string, Task[]>();
    
    // Group tasks by project
    if (taskData) {
      taskData.forEach(task => {
        if (!tasksById.has(task.project_id)) {
          tasksById.set(task.project_id, []);
        }
        
        tasksById.get(task.project_id)?.push({
          id: task.id,
          userId: task.assigned_to_id || '',
          projectId: task.project_id,
          title: task.title || '',
          description: task.description || '',
          deadline: parseDate(task.deadline),
          priority: (task.priority as TaskPriority) || 'Medium',
          status: (task.status || 'To Do') as TaskStatus,
          createdAt: parseDate(task.created_at),
          updatedAt: parseDate(task.updated_at),
          completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
          assignedToId: task.assigned_to_id,
          assignedToName: task.assigned_to_id,
          comments: [],
          cost: task.cost || 0
        });
      });
    }

    // Try to fetch team members for projects
    try {
      const { data: teamMembersData } = await supabase
        .from('project_team_members')
        .select('project_id, user_id');
      
      const teamMembersById = new Map<string, string[]>();
      
      if (teamMembersData) {
        teamMembersData.forEach(member => {
          if (!teamMembersById.has(member.project_id)) {
            teamMembersById.set(member.project_id, []);
          }
          teamMembersById.get(member.project_id)?.push(member.user_id);
        });
      }
      
      // Update projects with tasks and team members
      setProjects(prevProjects => 
        prevProjects.map(project => ({
          ...project,
          tasks: tasksById.get(project.id) || [],
          teamMembers: teamMembersById.get(project.id) || []
        }))
      );
      
    } catch (error) {
      console.error("Error fetching team members:", error);
      // At least update with tasks if team members failed
      setProjects(prevProjects => 
        prevProjects.map(project => ({
          ...project,
          tasks: tasksById.get(project.id) || []
        }))
      );
    }
  } catch (error) {
    console.error("Error fetching additional project data:", error);
  }
};
