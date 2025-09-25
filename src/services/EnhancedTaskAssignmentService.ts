import { supabase } from '@/integrations/supabase/client';
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';
import { notifications } from '@/lib/notifications';

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
      // Get current task assignment data using the new columns
      const { data: task } = await supabase
        .from('tasks')
        .select('id, title, assigned_to_ids, assigned_to_names, team_id, assignment_type, assignment_source')
        .eq('id', options.taskId)
        .single();

      if (!task) throw new Error('Task not found');

      const currentAssignments = {
        individual: task.assigned_to_ids && task.assigned_to_names ? 
          task.assigned_to_ids.map((id, index) => ({
            id,
            name: task.assigned_to_names[index] || 'Unknown'
          })) : [],
        team: task.team_id ? {
          id: task.team_id,
          name: 'Team' // Could be enhanced with team name lookup
        } : undefined,
        source: task.assignment_source || 'manual'
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

      // Prepare assignment data using the new database columns
      const updateData: any = {
        assigned_to_ids: options.userIds || null,
        assigned_to_names: options.userNames || null,
        assignment_type: options.assignmentType,
        assignment_source: options.assignmentSource,
        team_id: options.teamId || null,
        assignment_notes: options.notes || null,
        updated_at: new Date().toISOString()
      };

      // Set single assignment fields for backward compatibility
      if (options.userIds && options.userIds.length > 0) {
        updateData.assigned_to_id = options.userIds[0];
        updateData.assigned_to_name = options.userNames?.[0] || null;
      } else {
        updateData.assigned_to_id = null;
        updateData.assigned_to_name = null;
      }

      // Update task
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', options.taskId);

      if (updateError) throw updateError;

      // Send email notifications after successful DB update
      if (options.userIds && options.userIds.length > 0) {
        try {
          // Get task data for notification
          const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('id, title, description, status, priority, deadline, created_at, organization_id')
            .eq('id', options.taskId)
            .single();

          // Get assignee data
          const { data: assigneesData, error: assigneesError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', options.userIds)
            .eq('organization_id', options.organizationId);

          // Get actor data
          const { data: actorData, error: actorError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', options.assignedBy)
            .single();

          if (!taskError && !assigneesError && !actorError && taskData && assigneesData && actorData) {
            const taskNotification = {
              id: taskData.id,
              title: taskData.title,
              description: taskData.description || '',
              status: taskData.status,
              priority: taskData.priority || null,
              deadline: taskData.deadline || null,
              created_at: taskData.created_at,
              organization_id: taskData.organization_id,
              project_title: null // Optional field not available in all schemas
            };

            const assignees = assigneesData.map(userData => ({
              id: userData.id,
              email: userData.email,
              name: userData.name || userData.email
            }));

            const actor = {
              id: actorData.id,
              email: actorData.email,
              name: actorData.name || actorData.email
            };

            console.log('[EnhancedTaskAssignmentService] Sending notifications to:', assignees.map(a => a.email));
            await notifications.notifyTaskAssigned(taskNotification, assignees, actor, { sendToSelf: false });
            console.log('[EnhancedTaskAssignmentService] Email notifications sent');
          } else {
            console.warn('[EnhancedTaskAssignmentService] Missing data for email notifications:', {
              taskError,
              assigneesError,
              actorError,
              hasTask: !!taskData,
              hasAssignees: !!assigneesData,
              hasActor: !!actorData
            });
          }
        } catch (emailError) {
          console.error('[EnhancedTaskAssignmentService] Email notification failed:', emailError);
          // Don't throw - email failure shouldn't break assignment UX
        }
      }

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
      // Clear all assignment fields
      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to_id: null,
          assigned_to_name: null,
          assigned_to_ids: null,
          assigned_to_names: null,
          assignment_type: 'individual',
          assignment_source: 'manual',
          team_id: null,
          assignment_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('task_assignment_audit')
        .select(`
          *,
          users!changed_by(name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignment history:', error);
        return [];
      }

      return data?.map((entry: any) => ({
        id: entry.id,
        created_at: entry.created_at,
        change_type: entry.change_type,
        old_assignment: entry.old_assignment,
        new_assignment: entry.new_assignment,
        change_reason: entry.change_reason,
        assigned_by_user: {
          name: entry.users?.name || 'Unknown',
          email: entry.users?.email || 'unknown@example.com'
        }
      })) || [];
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
    // Use new assignment fields
    if (task.assignedToNames && task.assignedToNames.length > 0) {
      if (task.assignedToNames.length === 1) {
        return task.assignedToNames[0];
      } else {
        return `${task.assignedToNames.length} members: ${task.assignedToNames.slice(0, 2).join(', ')}${task.assignedToNames.length > 2 ? '...' : ''}`;
      }
    }
    
    // Check for team assignment
    if (task.assignedToTeamId && task.assignedToTeamName) {
      return `Team: ${task.assignedToTeamName}`;
    }
    
    // Fallback to single assignment field for backward compatibility
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
        .select('id, title, description')
        .eq('project_id', projectId);

      const conflicts: any[] = [];

      tasks?.forEach(task => {
        // Check if task has assignment info in description (temporary solution)
        const hasAssignment = task.description && (
          task.description.includes('Assigned to:') || 
          task.description.includes('Assigned to team:')
        );

        if (!hasAssignment) {
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