
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
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    const now = new Date();
    const projectId = uuidv4();
    
    console.log('Creating project with user ID:', user.id); // Debug log
    
    const projectToInsert = {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      budget: project.budget,
      is_completed: false
    };

    const { data, error: projectError } = await supabase
      .from('projects')
      .insert(projectToInsert)
      .select()
      .single();

    if (projectError) {
      console.error('Error adding project:', projectError);
      if (projectError.code === 'PGRST301') {
        toast.error('Authentication error. Please try logging in again.');
        return;
      }
      toast.error('Failed to create project. Please try again.');
      return;
    }

    if (!data) {
      toast.error('No data returned from database');
      return;
    }

    // Only try to add team members if project was created successfully
    if (project.teamMembers && project.teamMembers.length > 0) {
      const teamMemberInsertData = project.teamMembers.map(userId => ({
        project_id: projectId,
        user_id: userId
      }));

      const { error: membersError } = await supabase
        .from('project_team_members')
        .insert(teamMemberInsertData);

      if (membersError) {
        console.error('Error adding team members:', membersError);
        toast.error('Project created but had issues adding some team members');
      }
    }

    const newProject: Project = {
      id: projectId,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: user.id,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers: project.teamMembers || [],
      budget: project.budget,
      budgetSpent: 0,
      is_completed: false
    };

    setProjects(prevProjects => [...prevProjects, newProject]);
    playSuccessSound();
    toast.success('Project created successfully!');
    
    return newProject;
  } catch (error) {
    console.error('Error in addProject:', error);
    playErrorSound();
    toast.error('Failed to create project');
    return null;
  }
};
