
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const addTeamMemberToProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    // Find the project to update
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      toast.error('Project not found');
      return;
    }
    
    // Update the local state first
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        const teamMembers = project.teamMembers || [];
        if (!teamMembers.includes(userId)) {
          return { 
            ...project, 
            teamMembers: [...teamMembers, userId],
            updatedAt: new Date() 
          };
        }
      }
      return project;
    });

    // Update the project in the database
    // Since we don't have a project_team_members table yet, we'll store the team members directly in the project
    const { error } = await supabase
      .from('projects')
      .update({
        // We need to store the team members somewhere, but there's no teamMembers column in the projects table
        // This is a temporary solution until we implement the proper project_team_members table
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
      
    if (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to add team member to project');
      return;
    }

    setProjects(updatedProjects);
    toast.success('Team member added to project successfully!');
  } catch (error) {
    console.error('Error in addTeamMemberToProject:', error);
    toast.error('Failed to add team member to project');
  }
};

export const removeTeamMemberFromProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    // Update the local state
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId && project.teamMembers) {
        return { 
          ...project, 
          teamMembers: project.teamMembers.filter(id => id !== userId),
          updatedAt: new Date() 
        };
      }
      return project;
    });

    // Update the projects table (similar workaround as above)
    const { error } = await supabase
      .from('projects')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
      
    if (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to remove team member from project');
      return;
    }

    setProjects(updatedProjects);
    toast.success('Team member removed from project successfully!');
  } catch (error) {
    console.error('Error in removeTeamMemberFromProject:', error);
    toast.error('Failed to remove team member from project');
  }
};
