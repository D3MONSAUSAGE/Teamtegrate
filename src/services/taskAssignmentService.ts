
import { Task } from '@/types';

export interface TaskAssignments {
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
}

export interface AssignTaskParams {
  taskId: string;
  userIds: string[];
  userNames: string[];
  organizationId: string;
  currentUserId: string;
}

export class TaskAssignmentService {
  /**
   * Get unified assignment data from a task, handling legacy data
   */
  static getTaskAssignments(task: Task): TaskAssignments {
    // Check if we have multi-assignment data
    if (task.assignedToIds && task.assignedToIds.length > 0) {
      return {
        assignedToIds: task.assignedToIds,
        assignedToNames: task.assignedToNames || [],
        // For single assignment, also populate single fields for backward compatibility
        ...(task.assignedToIds.length === 1 && {
          assignedToId: task.assignedToIds[0],
          assignedToName: task.assignedToNames?.[0] || 'Assigned User'
        })
      };
    }
    
    // Fallback to legacy single assignment data
    if (task.assignedToId && task.assignedToId.trim() !== '') {
      return {
        assignedToId: task.assignedToId,
        assignedToName: task.assignedToName || 'Assigned User',
        assignedToIds: [task.assignedToId],
        assignedToNames: task.assignedToName ? [task.assignedToName] : ['Assigned User']
      };
    }
    
    // No assignment
    return {
      assignedToIds: [],
      assignedToNames: []
    };
  }

  /**
   * Check if a task is assigned to any user
   */
  static isTaskAssigned(task: Task): boolean {
    const assignments = this.getTaskAssignments(task);
    return (assignments.assignedToIds && assignments.assignedToIds.length > 0) || false;
  }

  /**
   * Check if a task has multiple assignments
   */
  static hasMultipleAssignments(task: Task): boolean {
    const assignments = this.getTaskAssignments(task);
    return (assignments.assignedToIds && assignments.assignedToIds.length > 1) || false;
  }

  /**
   * Get assignment display text
   */
  static getAssignmentDisplay(task: Task): string {
    const assignments = this.getTaskAssignments(task);
    
    if (!this.isTaskAssigned(task)) {
      return 'Unassigned';
    }

    if (this.hasMultipleAssignments(task)) {
      const count = assignments.assignedToNames?.length || 0;
      const firstName = assignments.assignedToNames?.[0] || 'User';
      return count > 1 ? `${firstName} +${count - 1} more` : firstName;
    }

    return assignments.assignedToName || assignments.assignedToNames?.[0] || 'Assigned User';
  }

  /**
   * Assign task to users (placeholder for future implementation)
   */
  static async assignTask(params: AssignTaskParams): Promise<boolean> {
    // This would be implemented to handle the actual assignment
    console.log('Assigning task:', params);
    return true;
  }

  /**
   * Unassign task (placeholder for future implementation)
   */
  static async unassignTask(taskId: string, organizationId: string): Promise<boolean> {
    // This would be implemented to handle the actual unassignment
    console.log('Unassigning task:', taskId);
    return true;
  }

  /**
   * Cleanup task assignment (placeholder for future implementation)
   */
  static async cleanupTaskAssignment(taskId: string, organizationId: string): Promise<void> {
    // This would be implemented to handle cleanup
    console.log('Cleaning up task assignment:', taskId);
  }
}
