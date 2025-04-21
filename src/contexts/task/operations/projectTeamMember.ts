
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
    // First update the database
    await supabase
      .from('project_team_members')
      .insert({
        project_id: projectId,
        team_member_id: userId
      });
    
    // Then update the local state
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
    // First remove from the database
    await supabase
      .from('project_team_members')
      .delete()
      .match({ project_id: projectId, team_member_id: userId });
    
    // Then update the local state
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

    setProjects(updatedProjects);
    toast.success('Team member removed from project successfully!');
  } catch (error) {
    console.error('Error in removeTeamMemberFromProject:', error);
    toast.error('Failed to remove team member from project');
  }
};
