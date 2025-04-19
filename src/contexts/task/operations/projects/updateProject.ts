
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playErrorSound } from '@/utils/sounds';

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };
    
    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.startDate !== undefined) updatedFields.start_date = updates.startDate.toISOString();
    if (updates.endDate !== undefined) updatedFields.end_date = updates.endDate.toISOString();
    if (updates.is_completed !== undefined) updatedFields.is_completed = updates.is_completed;
    
    const { error } = await supabase
      .from('projects')
      .update(updatedFields)
      .eq('id', projectId);
    
    if (error) {
      console.error('Error updating project:', error);
      playErrorSound();
      toast.error('Failed to update project');
      return;
    }
    
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id === projectId) {
        return { ...project, ...updates, updatedAt: now };
      }
      return project;
    }));
    
    toast.success('Project updated successfully!');
  } catch (error) {
    console.error('Error in updateProject:', error);
    playErrorSound();
    toast.error('Failed to update project');
  }
};
