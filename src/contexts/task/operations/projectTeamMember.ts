
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
    
    // Check if team member already exists to avoid duplicates
    const { data: existingMember, error: checkError } = await supabase
      .from('project_team_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking team member:', checkError);
      toast.error('Failed to check if team member already exists');
      return;
    }
    
    if (existingMember) {
      toast.info('User is already a team member of this project');
      return;
    }
    
    // Insert into project_team_members table
    const { error } = await supabase
      .from('project_team_members')
      .insert({
        project_id: projectId,
        user_id: userId
      });
      
    if (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member to project');
      return;
    }

    // Update the local state
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        const teamMembers = p.teamMembers || [];
        if (!teamMembers.includes(userId)) {
          return { 
            ...p, 
            teamMembers: [...teamMembers, userId],
            updatedAt: new Date() 
          };
        }
      }
      return p;
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
    // Delete from project_team_members table
    const { error } = await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member from project');
      return;
    }

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

    setProjects(updatedProjects);
    toast.success('Team member removed from project successfully!');
  } catch (error) {
    console.error('Error in removeTeamMemberFromProject:', error);
    toast.error('Failed to remove team member from project');
  }
};
