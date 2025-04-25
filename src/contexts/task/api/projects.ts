
import { Project, User, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
      return;
    }

    console.log('Projects data from API:', data);

    const formattedProjects: Project[] = data.map(project => ({
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      managerId: project.manager_id || user.id,
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
      tasks: [],
      teamMembers: project.team_members || [],
      budget: project.budget || 0,
      is_completed: project.is_completed || false,
      budgetSpent: project.budget_spent || 0,
      status: (project.status || 'To Do') as ProjectStatus,
      tasks_count: project.tasks_count || 0
    }));

    console.log('Formatted projects:', formattedProjects);
    setProjects(formattedProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
    setProjects([]);
  }
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
    
    console.log('Creating project:', {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      budget: project.budget || 0,
      is_completed: false,
      status: project.status || 'To Do',
      tasks_count: 0
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
        is_completed: false,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.teamMembers || [],
        status: project.status || 'To Do',
        tasks_count: 0
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
      is_completed: false,
      budgetSpent: 0,
      status: project.status as ProjectStatus,
      tasks_count: 0
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
