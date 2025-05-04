
import { Project, User, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    console.log('Fetching projects for user:', user.id);
    
    // Using direct SQL query to bypass RLS policies
    const { data, error } = await supabase.rpc('get_all_projects' as any);
    
    if (error) {
      console.error('Error fetching projects via RPC:', error);
      
      // Alternative approach if RPC fails - try direct query with auth
      console.log('Trying alternative project fetch method...');
      const { data: directData, error: directError } = await supabase.auth.getSession().then(
        async (session) => {
          if (session.data.session) {
            return await supabase
              .from('projects')
              .select('*')
              .order('created_at', { ascending: false });
          } else {
            return { data: null, error: new Error('No session') };
          }
        }
      );
      
      if (directError || !directData) {
        console.error('All project fetch attempts failed:', directError);
        toast.error('Failed to load projects. Please check database permissions.');
        setProjects([]);
        return;
      }

      // Set projects with the direct data
      processAndSetProjects(directData, setProjects);
      return;
    }

    // Process the RPC data
    processAndSetProjects(data, setProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
    setProjects([]);
  }
};

// Helper function to process projects data and set state
const processAndSetProjects = (
  data: any, 
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('No projects found in database');
    setProjects([]);
    return;
  }

  console.log('Projects data from API:', data);

  const formattedProjects: Project[] = data.map(project => {
    // Explicitly ensure status and is_completed are synchronized
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Always enforce consistency between status and is_completed
    if (status === 'Completed') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Completed';
    }
    
    return {
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      managerId: project.manager_id || '',
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
      tasks: [],
      teamMembers: Array.isArray(project.team_members) ? project.team_members : [],
      budget: project.budget || 0,
      is_completed: isCompleted,
      budgetSpent: project.budget_spent || 0,
      status: status as ProjectStatus,
      tasks_count: project.tasks_count || 0,
      tags: Array.isArray(project.tags) ? project.tags : []
    };
  });

  console.log('Formatted projects:', formattedProjects);
  setProjects(formattedProjects);
};

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: { id: string }
): Promise<Project | null> => {
  try {
    // Generate a unique ID for the project
    const projectId = uuidv4();
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Explicitly ensure status and is_completed are synchronized
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Always enforce consistency
    if (status === 'Completed') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Completed';
    }
    
    console.log('Creating project:', {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      budget: project.budget || 0,
      is_completed: isCompleted,
      status: status,
      tasks_count: 0,
      tags: project.tags || []
    });
    
    const { error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        manager_id: user.id,
        budget: project.budget || 0,
        is_completed: isCompleted,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.teamMembers || [],
        status: status,
        tasks_count: 0,
        tags: project.tags || []
      });

    if (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to create project');
      return null;
    }

    const newProject: Project = {
      id: projectId,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: user.id,
      budget: project.budget || 0,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers: project.teamMembers || [],
      is_completed: isCompleted,
      budgetSpent: 0,
      status: status as ProjectStatus,
      tasks_count: 0,
      tags: project.tags || []
    };

    console.log('New project created:', newProject);
    toast.success('Project created successfully');
    return newProject;
  } catch (error) {
    console.error('Error in addProject:', error);
    toast.error('Failed to create project');
    return null;
  }
};
