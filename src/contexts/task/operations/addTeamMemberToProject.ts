
import { Project, User } from '@/types';
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
    console.log(`Adding team member ${userId} to project ${projectId}`);

    // Find the project to update
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
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
      console.log('Team member already exists in project');
      toast.info('User is already a team member of this project');
      return;
    }

    console.log('Adding new team member to database');

    const { error } = await supabase
      .from('project_team_members')
      .insert({
        project_id: projectId,
        user_id: userId
      });

    if (error) {
      console.error('Error adding team member:', error);
      playErrorSound();
      toast.error('Failed to add team member to project');
      return;
    }

    console.log('Team member added successfully, updating local state');

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
    playSuccessSound();
    toast.success('Team member added to project successfully!');
  } catch (error) {
    console.error('Error in addTeamMemberToProject:', error);
    playErrorSound();
    toast.error('Failed to add team member to project');
  }
};
