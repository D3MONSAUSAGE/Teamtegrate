
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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
      return;
    }

    const formattedProjects: Project[] = data.map(project => ({
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      managerId: project.manager_id || user.id,
      budget: project.budget || 0,
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
      tasks: [],
      is_completed: project.is_completed || false,
      teamMembers: []
    }));

    setProjects(formattedProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
  }
};

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: { id: string }
): Promise<Project | null> => {
  try {
    // Generate a unique ID for the project
    const projectId = crypto.randomUUID();
    const now = new Date();
    
    const { data, error } = await supabase
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
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select();

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
      is_completed: false
    };

    toast.success('Project created successfully');
    return newProject;
  } catch (error) {
    console.error('Error in addProject:', error);
    toast.error('Failed to create project');
    return null;
  }
};
