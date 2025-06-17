
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const addProject = async (
  title: string, 
  description: string, 
  startDate: string, 
  endDate: string, 
  budget: number,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
    console.log('Adding project:', title, description, startDate, endDate, budget);
    
    const now = new Date();
    const projectId = crypto.randomUUID();
    
    const { error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        manager_id: user.id,
        budget: budget,
        budget_spent: 0,
        is_completed: false,
        team_members: [],
        tasks_count: 0,
        status: 'To Do',
        tags: [],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        organization_id: user.organizationId
      });

    if (error) {
      console.error('Error adding project:', error);
      playErrorSound();
      toast.error('Failed to add project');
      return;
    }

    const newProject: Project = {
      id: projectId,
      title,
      description,
      startDate: startDate,
      endDate: endDate,
      managerId: user.id,
      budget,
      budgetSpent: 0,
      isCompleted: false,
      teamMemberIds: [],
      tasksCount: 0,
      status: 'To Do',
      tags: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      organizationId: user.organizationId || ''
    };

    setProjects(prevProjects => [...prevProjects, newProject]);
    
    toast.success('Project added successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error adding project:', error);
    playErrorSound();
    toast.error('Failed to add project');
  }
};
