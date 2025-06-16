
import { Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { createProjectTeamAdditionNotification } from './assignment/createProjectNotification';

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

    // Check if team member already exists in the separate table
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

    // Check if user is already in the teamMemberIds array
    const currentTeamMembers = project.teamMemberIds || [];
    if (currentTeamMembers.includes(userId)) {
      console.log('Team member already exists in project array');
      toast.info('User is already a team member of this project');
      return;
    }

    console.log('Adding new team member to database and project array');

    // Add to project_team_members table first
    const { error: tableError } = await supabase
      .from('project_team_members')
      .insert({
        project_id: projectId,
        user_id: userId
      });

    if (tableError) {
      console.error('Error adding team member to table:', tableError);
      playErrorSound();
      toast.error('Failed to add team member to project');
      return;
    }

    // Update the projects table team_members array
    const updatedTeamMembers = [...currentTeamMembers, userId];
    const { error: arrayError } = await supabase
      .from('projects')
      .update({ 
        team_members: updatedTeamMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (arrayError) {
      console.error('Error updating project team_members array:', arrayError);
      // Try to rollback the table insert
      await supabase
        .from('project_team_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      playErrorSound();
      toast.error('Failed to update project team members');
      return;
    }

    console.log('Team member added successfully, updating local state');

    // Get current user info for notification
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: currentUserData } = await supabase
      .from('users')
      .select('name')
      .eq('id', currentUser?.id || '')
      .single();

    // Create notification for the added team member
    if (currentUserData && project.organizationId) {
      await createProjectTeamAdditionNotification(
        userId,
        project.title,
        currentUserData.name,
        project.organizationId
      );
    }

    // Update local state with the updated array
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          teamMemberIds: updatedTeamMembers,
          updatedAt: new Date()
        };
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
