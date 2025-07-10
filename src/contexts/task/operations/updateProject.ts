
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

    // Handle team members updates with enhanced consistency checks
    if (updates.teamMemberIds !== undefined) {
      try {
        console.log('Updating team members for project:', projectId, 'with IDs:', updates.teamMemberIds);
        
        // Get current team members from both storage locations for consistency check
        const [currentMembersResult, projectResult] = await Promise.all([
          supabase
            .from('project_team_members')
            .select('user_id')
            .eq('project_id', projectId),
          supabase
            .from('projects')
            .select('team_members')
            .eq('id', projectId)
            .single()
        ]);

        const { data: currentMembers } = currentMembersResult;
        const { data: projectData } = projectResult;

        const currentMemberIds = currentMembers ? currentMembers.map(m => m.user_id) : [];
        const currentArrayMemberIds = projectData?.team_members || [];
        const newMemberIds = updates.teamMemberIds || [];

        console.log('Current team members in project_team_members table:', currentMemberIds);
        console.log('Current team members in projects.team_members array:', currentArrayMemberIds);
        console.log('New team members to set:', newMemberIds);

        // Check for data inconsistency and log warning
        const inconsistencyDetected = JSON.stringify(currentMemberIds.sort()) !== JSON.stringify(currentArrayMemberIds.map(id => id.toString()).sort());
        if (inconsistencyDetected) {
          console.warn('Data inconsistency detected between project_team_members table and projects.team_members array', {
            table: currentMemberIds,
            array: currentArrayMemberIds
          });
        }

        const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
        const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));

        console.log('Members to add:', membersToAdd);
        console.log('Members to remove:', membersToRemove);

        // Perform database operations in transaction-like manner
        const operations = [];

        // Remove members that are no longer in the list
        if (membersToRemove.length > 0) {
          for (const userId of membersToRemove) {
            const removeOperation = supabase
              .from('project_team_members')
              .delete()
              .eq('project_id', projectId)
              .eq('user_id', userId);
            
            operations.push(removeOperation);
          }
        }

        // Add new members
        if (membersToAdd.length > 0) {
          const newMembersData = membersToAdd.map(userId => ({
            project_id: projectId,
            user_id: userId
          }));

          const addOperation = supabase
            .from('project_team_members')
            .insert(newMembersData);
            
          operations.push(addOperation);
        }

        // Execute all team member operations
        const results = await Promise.all(operations);
        
        // Check for errors in team member operations
        for (const result of results) {
          if (result.error) {
            console.error('Error in team member operation:', result.error);
            throw result.error;
          }
        }

        console.log('Successfully updated team members in project_team_members table');

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
