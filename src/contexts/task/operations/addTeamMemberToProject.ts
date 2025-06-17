
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const addTeamMemberToProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    console.log('Adding team member to project:', { projectId, userId });

    // Add team member to project_team_members table
    const { error: teamMemberError } = await supabase
      .from('project_team_members')
      .insert({
        project_id: projectId,
        user_id: userId
      });

    if (teamMemberError) {
      console.error('Error adding team member:', teamMemberError);
      playErrorSound();
      toast.error('Failed to add team member to project');
      return;
    }

    // Get the current project to update team_members array
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    const currentTeamMembers = project.teamMemberIds || [];
    if (currentTeamMembers.includes(userId)) {
      toast.info('User is already a team member');
      return;
    }

    const updatedTeamMembers = [...currentTeamMembers, userId];

    // Update the projects table with the new team member
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        team_members: updatedTeamMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project team members:', updateError);
      // Remove the team member we just added since project update failed
      await supabase
        .from('project_team_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      playErrorSound();
      toast.error('Failed to update project team members');
      return;
    }

    // Update local state
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              teamMemberIds: updatedTeamMembers,
              updatedAt: new Date().toISOString()
            }
          : project
      )
    );

    toast.success('Team member added successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error in addTeamMemberToProject:', error);
    playErrorSound();
    toast.error('Failed to add team member to project');
  }
};
