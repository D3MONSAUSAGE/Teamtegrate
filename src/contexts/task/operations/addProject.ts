
import { Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getUserOrganizationId, fixProjectProperties } from '@/utils/typeCompatibility';

export const addProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  user: User,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    if (!getUserOrganizationId(user)) {
      toast.error('Organization context required');
      return;
    }

    const projectId = `project_${Date.now()}`;
    
    const { error } = await supabase
      .from('projects')
      .insert([{
        id: projectId,
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        start_date: projectData.startDate.toISOString(),
        end_date: projectData.endDate.toISOString(),
        manager_id: user.id,
        team_members: projectData.teamMemberIds || [],
        budget: projectData.budget,
        budget_spent: 0,
        is_completed: false,
        tags: projectData.tags || [],
        tasks_count: 0,
        organization_id: getUserOrganizationId(user)
      }]);

    if (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return;
    }

    const newProject: Project = {
      id: projectId,
      title: projectData.title,
      description: projectData.description,
      status: projectData.status,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      managerId: user.id,
      teamMemberIds: projectData.teamMemberIds || [],
      budget: projectData.budget,
      budgetSpent: 0,
      tasksCount: 0, // Fix property name
      tags: projectData.tags || [],
      organizationId: getUserOrganizationId(user),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setProjects(prev => [fixProjectProperties(newProject), ...prev]);
    toast.success('Project created successfully!');
  } catch (error) {
    console.error('Error adding project:', error);
    toast.error('Failed to create project');
  }
};
