
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

    const { error } = await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing team member:', error);
      playErrorSound();
      toast.error('Failed to remove team member from project');
      return;
    }

    console.log('Team member removed successfully, updating local state');

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
    playSuccessSound();
    toast.success('Team member removed from project successfully!');
  } catch (error) {
    console.error('Error in removeTeamMemberFromProject:', error);
    playErrorSound();
    toast.error('Failed to remove team member from project');
  }
};
