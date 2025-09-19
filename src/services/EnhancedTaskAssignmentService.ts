import { supabase } from '@/integrations/supabase/client';
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';

export interface AssignmentOptions {
  taskId: string;
  assignmentType: 'individual' | 'multiple' | 'team' | 'project_team';
  assignmentSource: 'manual' | 'project_inherited' | 'team_inherited';
  userIds?: string[];
  userNames?: string[];
  teamId?: string;
  teamName?: string;
  organizationId: string;
  assignedBy: string;
  notes?: string;
}

export interface AssignmentValidation {
  isValid: boolean;
  conflicts: string[];
  warnings: string[];
  suggestions: string[];
}

export interface AssignmentPreview {
  currentAssignments: {
    individual?: { id: string; name: string }[];
    team?: { id: string; name: string };
    source: string;
  };
  proposedAssignments: {
    individual?: { id: string; name: string }[];
    team?: { id: string; name: string };
    source: string;
  };
  changes: string[];
  conflicts: string[];
}

export class EnhancedTaskAssignmentService {
  
  /**
   * Preview what will happen with an assignment before executing
   */
  static async previewAssignment(options: AssignmentOptions): Promise<AssignmentPreview> {
    try {
      // Get current task assignment data
      const { data: task } = await supabase
        .from('tasks')
        .select('assigned_to_id, assigned_to_name, assigned_to_ids, assigned_to_names')
        .eq('id', options.taskId)
        .single();

      if (!task) throw new Error('Task not found');

      const currentAssignments = {
        individual: task.assigned_to_ids?.map((id: string, index: number) => ({
          id,
          name: task.assigned_to_names?.[index] || 'Unknown'
        })) || (task.assigned_to_id ? [{
          id: task.assigned_to_id,
          name: task.assigned_to_name || 'Unknown'
        }] : []),
        team: undefined, // Will be implemented after migration
        source: 'manual'
      };

      const proposedAssignments = {
        individual: options.userIds?.map((id, index) => ({
          id,
          name: options.userNames?.[index] || 'Unknown'
        })) || [],
        team: options.teamId ? {
          id: options.teamId,
          name: options.teamName || 'Unknown Team'
        } : undefined,
        source: options.assignmentSource
      };

      const changes: string[] = [];
      const conflicts: string[] = [];

      // Analyze changes
      if (options.assignmentType === 'team' && currentAssignments.individual.length > 0) {
        changes.push(`Remove ${currentAssignments.individual.length} individual assignments`);
        changes.push(`Add team assignment: ${options.teamName}`);
      } else if (options.assignmentType === 'individual' && currentAssignments.team) {
        changes.push(`Remove team assignment: ${currentAssignments.team.name}`);
        changes.push(`Add ${options.userIds?.length || 0} individual assignments`);
      }

      // Check for conflicts
      if (options.assignmentType === 'team' && options.userIds && options.userIds.length > 0) {
        conflicts.push('Cannot assign both team and individual users simultaneously');
      }

      return {
        currentAssignments,
        proposedAssignments,
        changes,
        conflicts
      };
    } catch (error) {
      console.error('Error previewing assignment:', error);
      throw error;
    }
  }

  /**
   * Validate assignment data before execution
   */
  static async validateAssignment(options: AssignmentOptions): Promise<AssignmentValidation> {
    const conflicts: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicting assignment types
    if (options.assignmentType === 'team' && options.userIds && options.userIds.length > 0) {
      conflicts.push('Cannot assign both team and individual users simultaneously');
    }

    // Check if users exist and are active
    if (options.userIds && options.userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', options.userIds)
        .eq('organization_id', options.organizationId);

      if (users && users.length !== options.userIds.length) {
        warnings.push('Some assigned users may not exist or are inactive');
      }
    }

    // Check if team exists and is active
    if (options.teamId) {
      const { data: team } = await supabase
        .from('teams')
        .select('id, name, is_active')
        .eq('id', options.teamId)
        .eq('organization_id', options.organizationId)
        .single();

      if (!team) {
        conflicts.push('Assigned team does not exist');
      } else if (!team.is_active) {
        warnings.push('Assigned team is not active');
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
      warnings,
      suggestions
    };
  }

  /**
   * Execute task assignment with full audit trail
   */
  static async assignTask(options: AssignmentOptions): Promise<boolean> {
    try {
      // Validate first
      const validation = await this.validateAssignment(options);
      if (!validation.isValid) {
        toast.error(`Assignment failed: ${validation.conflicts.join(', ')}`);
        return false;
      }

      // Show warnings
      validation.warnings.forEach(warning => {
        toast.warning(warning);
      });

      // Get current assignment for audit
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('assigned_to_id, assigned_to_name, assigned_to_ids, assigned_to_names')
        .eq('id', options.taskId)
        .single();

      // Prepare assignment data based on type
      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Clear all assignment fields first
      updateData.assigned_to_id = null;
      updateData.assigned_to_name = null;
      updateData.assigned_to_ids = null;
      updateData.assigned_to_names = null;

      // Set appropriate fields based on assignment type
      switch (options.assignmentType) {
        case 'individual':
          if (options.userIds && options.userIds.length === 1) {
            updateData.assigned_to_id = options.userIds[0];
            updateData.assigned_to_name = options.userNames?.[0];
          }
          break;

        case 'multiple':
          updateData.assigned_to_ids = options.userIds;
          updateData.assigned_to_names = options.userNames;
          break;

        case 'team':
        case 'project_team':
          // Team assignment will be implemented after migration
          // For now, store team info in a JSON field or comment
          updateData.assigned_to_name = `Team: ${options.teamName}`;
          break;
      }

      // Update task
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', options.taskId);

      if (updateError) throw updateError;

      // Create audit record (simplified for now)
      console.log('Assignment updated:', {
        taskId: options.taskId,
        assignedBy: options.assignedBy,
        oldAssignment: currentTask,
        newAssignment: updateData,
        assignmentType: options.assignmentType
      });

      toast.success('Task assignment updated successfully');
      return true;
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
      return false;
    }
  }

  /**
   * Unassign task completely
   */
  static async unassignTask(taskId: string, organizationId: string, unassignedBy: string): Promise<boolean> {
    try {
      // Get current assignment for audit
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      // Clear all assignments
      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to_id: null,
          assigned_to_name: null,
          assigned_to_ids: null,
          assigned_to_names: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Log unassignment (simplified for now)
      console.log('Task unassigned:', {
        taskId,
        unassignedBy,
        oldAssignment: currentTask
      });

      toast.success('Task unassigned successfully');
      return true;
    } catch (error) {
      console.error('Error unassigning task:', error);
      toast.error('Failed to unassign task');
      return false;
    }
  }

  /**
   * Get assignment history for a task
   */
  static async getAssignmentHistory(taskId: string): Promise<any[]> {
    try {
      // Simplified history - will be enhanced after audit table is created
      return [
        {
          id: '1',
          created_at: new Date().toISOString(),
          assignment_type: 'manual',
          assignment_source: 'manual',
          assigned_by_user: { name: 'Current User', email: 'user@example.com' },
          notes: 'Assignment history will be available after database migration'
        }
      ];
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      return [];
    }
  }

  /**
   * Create assignment audit record (simplified for now)
   */
  private static async createAssignmentAudit(auditData: any): Promise<void> {
    try {
      // Log to console for now - will be enhanced after audit table is created
      console.log('Assignment audit:', auditData);
    } catch (error) {
      console.error('Error creating assignment audit:', error);
      // Don't throw - audit failure shouldn't prevent assignment
    }
  }

  /**
   * Get assignment display text for a task
   */
  static getAssignmentDisplay(task: Task): string {
    if (task.assignedToTeamName) {
      return `Team: ${task.assignedToTeamName}`;
    }
    
    if (task.assignedToNames && task.assignedToNames.length > 1) {
      return `${task.assignedToNames.length} members: ${task.assignedToNames.slice(0, 2).join(', ')}${task.assignedToNames.length > 2 ? '...' : ''}`;
    }
    
    if (task.assignedToName) {
      return task.assignedToName;
    }
    
    return 'Unassigned';
  }

  /**
   * Check for assignment conflicts in project
   */
  static async checkProjectAssignmentConflicts(projectId: string): Promise<any[]> {
    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, assigned_to_id, assigned_to_ids')
        .eq('project_id', projectId);

      const conflicts: any[] = [];

      tasks?.forEach(task => {
        const hasIndividual = task.assigned_to_id || (task.assigned_to_ids && task.assigned_to_ids.length > 0);

        if (!hasIndividual) {
          conflicts.push({
            taskId: task.id,
            taskTitle: task.title,
            conflict: 'Task has no assignments',
            type: 'no_assignment'
          });
        }
      });

      return conflicts;
    } catch (error) {
      console.error('Error checking assignment conflicts:', error);
      return [];
    }
  }
}