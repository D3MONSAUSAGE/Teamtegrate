
import { User, Project } from '@/types';
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
    if (updates.startDate !== undefined) updatedFields.start_date = updates.startDate.toISOString();
    if (updates.endDate !== undefined) updatedFields.end_date = updates.endDate.toISOString();
    if (updates.budget !== undefined) updatedFields.budget = updates.budget;
    if (updates.tags !== undefined) updatedFields.tags = updates.tags;
    if (updates.is_completed !== undefined) updatedFields.is_completed = updates.is_completed;
    if (updates.status !== undefined) {
      updatedFields.status = updates.status;
      
      // Automatically set is_completed based on status
      if (updates.status === 'Completed') {
        updatedFields.is_completed = true;
      } else if (updates.status === 'To Do' || updates.status === 'In Progress') {
        updatedFields.is_completed = false;
      }
    }

    console.log('Sending update with fields:', updatedFields);

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

    if (updates.teamMembers !== undefined) {
      try {
        const { data: currentMembers } = await supabase
          .from('project_team_members')
          .select('user_id')
          .eq('project_id', projectId);

        const currentMemberIds = currentMembers ? currentMembers.map(m => m.user_id) : [];
        const newMemberIds = updates.teamMembers || [];

        const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
        const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));

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
          }
        }

        if (membersToRemove.length > 0) {
          for (const userId of membersToRemove) {
            const { error: removeError } = await supabase
              .from('project_team_members')
              .delete()
              .eq('project_id', projectId)
              .eq('user_id', userId);

            if (removeError) {
              console.error('Error removing team member:', removeError);
            }
          }
        }
      } catch (teamError) {
        console.error('Error managing team members:', teamError);
        toast.error('Project updated but had issues updating team members');
      }
    }

    // Update the local state
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id === projectId) {
        // Make sure the status and is_completed fields are synchronized
        const updatedProject = { ...project, ...updates, updatedAt: now };
        
        // Ensure status and is_completed are in sync
        if (updatedProject.status === 'Completed' && !updatedProject.is_completed) {
          updatedProject.is_completed = true;
        } else if ((updatedProject.status === 'To Do' || updatedProject.status === 'In Progress') && updatedProject.is_completed) {
          updatedProject.is_completed = false;
        }
        
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
