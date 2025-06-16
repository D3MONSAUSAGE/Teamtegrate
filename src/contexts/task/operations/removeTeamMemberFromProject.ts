
import { Project, User } from '@/types';
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
    console.log(`Removing team member ${userId} from project ${projectId}`);

    // Find the project to update
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      toast.error('Project not found');
      return;
    }

    // Remove from project_team_members table
    const { error: tableError } = await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (tableError) {
      console.error('Error removing team member from table:', tableError);
      playErrorSound();
      toast.error('Failed to remove team member from project');
      return;
    }

    // Update the projects table team_members array
    const currentTeamMembers = project.team_members || [];
    const updatedTeamMembers = currentTeamMembers.filter(id => id !== userId);
    
    const { error: arrayError } = await supabase
      .from('projects')
      .update({ 
        team_members: updatedTeamMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (arrayError) {
      console.error('Error updating project team_members array:', arrayError);
      // Try to rollback the table deletion by re-inserting
      await supabase
        .from('project_team_members')
        .insert({
          project_id: projectId,
          user_id: userId
        });
      
      playErrorSound();
      toast.error('Failed to update project team members');
      return;
    }

    console.log('Team member removed successfully, updating local state');

    // Update local state with the updated array
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        return {
          ...project,
          team_members: updatedTeamMembers,
          updatedAt: new Date()
        };
      }
      return project;
    });

    setProjects(updatedProjects);
    playSuccessSound();
    toast.success('Team member removed from project successfully!');
  } catch (error) {
    console.error('Error in removeTeamMemberFromProject:', error);
    playErrorSound();
    toast.error('Failed to remove team member from project');
  }
};
