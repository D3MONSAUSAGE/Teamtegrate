
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const now = new Date();
    const projectId = uuidv4();
    
    const projectToInsert = {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    console.log('Inserting project with manager_id:', projectToInsert.manager_id);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectToInsert)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error adding project:', error);
      playErrorSound();
      toast.error('Failed to create project');
      return;
    }
    
    if (data) {
      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        managerId: data.manager_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        tasks: [],
        teamMembers: [],
        tags: []
      };
      
      setProjects(prevProjects => [...prevProjects, newProject]);
      playSuccessSound();
      toast.success('Project created successfully!');
    }
  } catch (error) {
    console.error('Error in addProject:', error);
    playErrorSound();
    toast.error('Failed to create project');
  }
};
