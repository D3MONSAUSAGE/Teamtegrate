
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const removeTeamMemberFromProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    console.log('Removing team member from project:', { projectId, userId });

    // Remove team member from project_team_members table
    const { error: teamMemberError } = await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (teamMemberError) {
      console.error('Error removing team member:', teamMemberError);
      playErrorSound();
      toast.error('Failed to remove team member from project');
      return;
    }

    // Get the current project to update team_members array
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    const currentTeamMembers = project.teamMemberIds || [];
    const updatedTeamMembers = currentTeamMembers.filter(id => id !== userId);

    // Update the projects table with the updated team members
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        team_members: updatedTeamMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project team members:', updateError);
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

    toast.success('Team member removed successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error in removeTeamMemberFromProject:', error);
    playErrorSound();
    toast.error('Failed to remove team member from project');
  }
};
