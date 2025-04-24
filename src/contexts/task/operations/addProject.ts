
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<Project | null> => {
  try {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return null;
    }
    
    const now = new Date();
    const projectId = uuidv4();
    
    console.log('Creating project with user ID:', user.id, 'project:', project);
    
    // Prepare project data for insertion with fallback values
    const projectToInsert = {
      id: projectId,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      start_date: project.startDate?.toISOString() || now.toISOString(),
      end_date: project.endDate?.toISOString() || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      manager_id: user.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      budget: project.budget || 0,
      is_completed: false,
      budget_spent: 0
    };

    // Insert into Supabase with error handling
    const { error: projectError } = await supabase
      .from('projects')
      .insert(projectToInsert);

    if (projectError) {
      console.error('Error adding project:', projectError);
      playErrorSound();
      toast.error('Failed to create project. Please try again.');
      return null;
    }

    // Create local project object for state update
    const newProject: Project = {
      id: projectId,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      startDate: project.startDate || now,
      endDate: project.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      managerId: user.id,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers: [],
      budget: project.budget || 0,
      budgetSpent: 0,
      is_completed: false
    };

    // Add team members if available - do this after project creation succeeded
    if (project.teamMembers && project.teamMembers.length > 0) {
      try {
        const teamMemberInsertData = project.teamMembers.map(userId => ({
          project_id: projectId,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('project_team_members')
          .insert(teamMemberInsertData);

        if (membersError) {
          console.error('Error adding team members:', membersError);
          toast.warning('Project created but had issues adding team members');
        } else {
          // If team members were added successfully, update the local project
          newProject.teamMembers = project.teamMembers;
        }
      } catch (memberError) {
        console.error('Error processing team members:', memberError);
      }
    }

    // Update local state
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
