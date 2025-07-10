
import { User, Project, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) {
      toast.error('You must be logged in to update a project');
      return;
    }
    
    console.log('Updating project:', projectId, 'with updates:', updates);
    
    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };
    
    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.startDate !== undefined) updatedFields.start_date = updates.startDate;
    if (updates.endDate !== undefined) updatedFields.end_date = updates.endDate;
    if (updates.budget !== undefined) updatedFields.budget = updates.budget;
    if (updates.tags !== undefined) updatedFields.tags = updates.tags;
    
    // Handle status and isCompleted together to ensure they are synchronized
    if (updates.status !== undefined || updates.isCompleted !== undefined) {
      if (updates.isCompleted !== undefined) {
        updatedFields.is_completed = updates.isCompleted;
        
        if (updates.isCompleted === true) {
          updatedFields.status = 'Completed';
        } 
        else if (!updates.status) {
          updatedFields.status = 'In Progress';
        }
      }
      
      if (updates.status !== undefined) {
        updatedFields.status = updates.status;
        updatedFields.is_completed = updates.status === 'Completed';
      }
    }

    // Handle team members updates FIRST before updating the main project
    if (updates.teamMemberIds !== undefined) {
      try {
        console.log('Updating team members for project:', projectId, 'with IDs:', updates.teamMemberIds);
        
        // Get current team members
        const { data: currentMembers } = await supabase
          .from('project_team_members')
          .select('user_id')
          .eq('project_id', projectId);

        const currentMemberIds = currentMembers ? currentMembers.map(m => m.user_id) : [];
        const newMemberIds = updates.teamMemberIds || [];

        console.log('Current members:', currentMemberIds);
        console.log('New members:', newMemberIds);

        const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
        const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));

        console.log('Members to add:', membersToAdd);
        console.log('Members to remove:', membersToRemove);

        // Remove members that are no longer in the list
        if (membersToRemove.length > 0) {
          for (const userId of membersToRemove) {
            const { error: removeError } = await supabase
              .from('project_team_members')
              .delete()
              .eq('project_id', projectId)
              .eq('user_id', userId);

            if (removeError) {
              console.error('Error removing team member:', removeError);
            } else {
              console.log('Successfully removed team member:', userId);
            }
          }
        }

        // Add new members
        if (membersToAdd.length > 0) {
          const newMembersData = membersToAdd.map(userId => ({
            project_id: projectId,
            user_id: userId
          }));

          const { error: addError } = await supabase
            .from('project_team_members')
            .insert(newMembersData);

          if (addError) {
            console.error('Error adding new team members:', addError);
            throw addError;
          } else {
            console.log('Successfully added team members:', membersToAdd);
          }
        }

        // Update the team_members array in the projects table for consistency
        updatedFields.team_members = newMemberIds;
        console.log('Setting team_members array to:', newMemberIds);

      } catch (teamError) {
        console.error('Error managing team members:', teamError);
        playErrorSound();
        toast.error('Failed to update team members');
        return; // Don't proceed with project update if team member update fails
      }
    }

    console.log('Sending update with fields:', updatedFields);

    // Update the main project record
    const { error } = await supabase
      .from('projects')
      .update(updatedFields)
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      playErrorSound();
      toast.error('Failed to update project');
      return;
    }

    console.log('Project updated successfully in database');

    // Update the local state with proper synchronization
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id === projectId) {
        const updatedProject = { ...project, ...updates, updatedAt: now.toISOString() };
        
        // Ensure status and isCompleted are always in sync in local state
        if (updatedFields.status === 'Completed') {
          updatedProject.isCompleted = true;
        } else if (updatedFields.status) {
          updatedProject.isCompleted = false;
        }
        
        if (updatedFields.is_completed === true) {
          updatedProject.status = 'Completed';
        }

        // Ensure team member IDs are properly updated in local state
        if (updates.teamMemberIds !== undefined) {
          updatedProject.teamMemberIds = updates.teamMemberIds;
        }
        
        console.log('Updated project in local state:', updatedProject);
        return updatedProject;
      }
      return project;
    }));

    toast.success('Project updated successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error in updateProject:', error);
    playErrorSound();
    toast.error('Failed to update project');
  }
};
