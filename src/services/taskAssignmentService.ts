
import { supabase } from '@/integrations/supabase/client';
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';

export interface AssignmentData {
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
}

export interface UnifiedAssignmentParams {
  taskId: string;
  userIds: string[];
  userNames: string[];
  organizationId: string;
  currentUserId: string;
}

/**
 * Unified task assignment service that handles both single and multi-assignment
 */
export class TaskAssignmentService {
  
  /**
   * Assign task to users (handles both single and multiple)
   */
  static async assignTask({
    taskId,
    userIds,
    userNames,
    organizationId,
    currentUserId
  }: UnifiedAssignmentParams): Promise<boolean> {
    try {
      const now = new Date();
      
      // Determine if this is single or multi-assignment
      const isSingleAssignment = userIds.length === 1;
      
      const updateData: any = {
        updated_at: now.toISOString()
      };

      if (isSingleAssignment) {
        // Single assignment - use single fields and clear multi fields
        updateData.assigned_to_id = userIds[0];
        updateData.assigned_to_ids = [];
        updateData.assigned_to_names = [];
      } else {
        // Multi assignment - use multi fields and clear single fields
        updateData.assigned_to_id = null;
        updateData.assigned_to_ids = userIds;
        updateData.assigned_to_names = userNames;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error assigning task:', error);
        toast.error('Failed to assign task');
        return false;
      }

      // Create notifications for assigned users
      await this.createAssignmentNotifications(
        taskId,
        userIds,
        userNames,
        currentUserId,
        organizationId
      );

      const assigneeText = isSingleAssignment 
        ? userNames[0] 
        : `${userNames.length} team members`;
      
      toast.success(`Task assigned to ${assigneeText} successfully!`);
      return true;

    } catch (error) {
      console.error('Error in task assignment:', error);
      toast.error('Failed to assign task');
      return false;
    }
  }

  /**
   * Unassign task (remove all assignments)
   */
  static async unassignTask(taskId: string, organizationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to_id: null,
          assigned_to_ids: [],
          assigned_to_names: [],
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error unassigning task:', error);
        toast.error('Failed to unassign task');
        return false;
      }

      toast.success('Task unassigned successfully!');
      return true;

    } catch (error) {
      console.error('Error unassigning task:', error);
      toast.error('Failed to unassign task');
      return false;
    }
  }

  /**
   * Get current task assignments in a normalized format
   */
  static getTaskAssignments(task: Task): AssignmentData {
    // Check for multi-assignment first
    if (task.assignedToIds && task.assignedToIds.length > 0) {
      return {
        assignedToIds: task.assignedToIds,
        assignedToNames: task.assignedToNames || []
      };
    }
    
    // Check for single assignment
    if (task.assignedToId) {
      return {
        assignedToId: task.assignedToId,
        assignedToName: task.assignedToName || 'Assigned User',
        assignedToIds: [task.assignedToId],
        assignedToNames: [task.assignedToName || 'Assigned User']
      };
    }

    // No assignment
    return {};
  }

  /**
   * Check if task has any assignments
   */
  static isTaskAssigned(task: Task): boolean {
    return !!(
      (task.assignedToIds && task.assignedToIds.length > 0) ||
      task.assignedToId
    );
  }

  /**
   * Check if task has multiple assignments
   */
  static hasMultipleAssignments(task: Task): boolean {
    return !!(task.assignedToIds && task.assignedToIds.length > 1);
  }

  /**
   * Create notifications for task assignment
   */
  private static async createAssignmentNotifications(
    taskId: string,
    userIds: string[],
    userNames: string[],
    currentUserId: string,
    organizationId: string
  ): Promise<void> {
    try {
      // Get task title for notification
      const { data: task } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', taskId)
        .single();

      if (!task) return;

      const notifications = userIds.map((userId, index) => ({
        user_id: userId,
        title: userId === currentUserId ? 'Task Self-Assigned' : 'Task Assigned',
        content: userId === currentUserId 
          ? `You assigned yourself to task: ${task.title}`
          : `You've been assigned to task: ${task.title}`,
        type: 'task_assignment',
        task_id: taskId,
        organization_id: organizationId
      }));

      await supabase.from('notifications').insert(notifications);
      
    } catch (error) {
      console.error('Error creating assignment notifications:', error);
      // Don't fail the assignment if notifications fail
    }
  }

  /**
   * Clean up inconsistent assignment data for a task
   */
  static async cleanupTaskAssignment(taskId: string, organizationId: string): Promise<void> {
    try {
      const { data: task } = await supabase
        .from('tasks')
        .select('assigned_to_id, assigned_to_ids, assigned_to_names')
        .eq('id', taskId)
        .single();

      if (!task) return;

      const hasMulti = task.assigned_to_ids && task.assigned_to_ids.length > 0;
      const hasSingle = !!task.assigned_to_id;

      // If both exist, prioritize multi-assignment
      if (hasMulti && hasSingle) {
        await supabase
          .from('tasks')
          .update({
            assigned_to_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);
      }
    } catch (error) {
      console.error('Error cleaning up task assignment:', error);
    }
  }
}
