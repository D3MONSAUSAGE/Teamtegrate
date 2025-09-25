
import { supabase } from '@/integrations/supabase/client';
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';
import { notifications } from '@/lib/notifications';

interface AssignTaskParams {
  taskId: string;
  userIds: string[];
  userNames: string[];
  organizationId: string;
  currentUserId: string;
}

export class TaskAssignmentService {
  static async assignTask(params: AssignTaskParams): Promise<boolean> {
    const { taskId, userIds, userNames, organizationId } = params;

    try {
      console.log('TaskAssignmentService: Assigning task to multiple users:', {
        taskId,
        userIds,
        userNames
      });

      const updateData: any = {
        assigned_to_ids: userIds,
        assigned_to_names: userNames,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // For backward compatibility, set single assignment fields if only one user
      if (userIds.length === 1) {
        updateData.assigned_to_id = userIds[0];
      } else {
        updateData.assigned_to_id = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('TaskAssignmentService: Error assigning task:', error);
        toast.error('Failed to assign task to users');
        return false;
      }

      const userNamesText = userNames.length > 3 
        ? `${userNames.slice(0, 3).join(', ')} and ${userNames.length - 3} others`
        : userNames.join(', ');

      // Get task details for email notification
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority, deadline, created_at, organization_id,
          projects (title)
        `)
        .eq('id', taskId)
        .single();

      // Get user details for email notification
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds);

      // Get actor details
      const { data: actorData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', params.currentUserId)
        .single();

      // Send email notifications
      if (taskData && usersData && actorData) {
        console.log('[TaskAssignmentService] Preparing email notifications for task:', taskData.id);
        
        const taskNotification = {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          deadline: taskData.deadline,
          created_at: taskData.created_at,
          organization_id: taskData.organization_id,
          project_title: (taskData.projects as any)?.title
        };

        const assignees = usersData.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name || user.email
        }));

        const actor = {
          id: actorData.id,
          email: actorData.email,
          name: actorData.name || actorData.email
        };

        console.log('[TaskAssignmentService] Sending notifications to:', assignees.map(a => a.email));
        await notifications.notifyTaskAssigned(taskNotification, assignees, actor, { sendToSelf: false });
        console.log('[TaskAssignmentService] Email notifications sent');
      } else {
        console.warn('[TaskAssignmentService] Missing data for email notifications:', {
          hasTask: !!taskData,
          hasUsers: !!usersData,
          hasActor: !!actorData
        });
      }

      toast.success(`Task assigned to ${userNamesText}`);
      return true;
    } catch (error) {
      console.error('TaskAssignmentService: Error in assignTask:', error);
      toast.error('Failed to assign task');
      return false;
    }
  }

  static async unassignTask(taskId: string, organizationId: string): Promise<boolean> {
    try {
      console.log('TaskAssignmentService: Unassigning task:', taskId);

      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to_id: null,
          assigned_to_ids: [],
          assigned_to_names: [],
          assigned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('TaskAssignmentService: Error unassigning task:', error);
        toast.error('Failed to unassign task');
        return false;
      }

      toast.success('Task unassigned successfully');
      return true;
    } catch (error) {
      console.error('TaskAssignmentService: Error in unassignTask:', error);
      toast.error('Failed to unassign task');
      return false;
    }
  }

  static getTaskAssignments(task: Task) {
    return {
      assignedToIds: task.assignedToIds || [],
      assignedToNames: task.assignedToNames || [],
      assignedToId: task.assignedToId,
      assignedToName: task.assignedToName
    };
  }

  static getAssignmentDisplay(task: Task): string {
    if (!task.assignedToIds || task.assignedToIds.length === 0) {
      return 'Unassigned';
    }

    if (task.assignedToIds.length === 1) {
      return task.assignedToNames?.[0] || 'Assigned User';
    }

    const names = task.assignedToNames || [];
    if (names.length <= 2) {
      return names.join(' & ');
    }

    return `${names[0]} & ${names.length - 1} others`;
  }

  static async cleanupTaskAssignment(taskId: string, organizationId: string): Promise<void> {
    try {
      // Clean up any invalid assignment data
      const { data: task } = await supabase
        .from('tasks')
        .select('assigned_to_ids, assigned_to_names')
        .eq('id', taskId)
        .eq('organization_id', organizationId)
        .single();

      if (!task) return;

      // Filter out empty strings and null values
      const cleanUserIds = (task.assigned_to_ids || []).filter(id => id && id.trim() !== '');
      const cleanUserNames = (task.assigned_to_names || []).filter(name => name && name.trim() !== '');

      // Ensure arrays are the same length
      const maxLength = Math.min(cleanUserIds.length, cleanUserNames.length);
      const finalUserIds = cleanUserIds.slice(0, maxLength);
      const finalUserNames = cleanUserNames.slice(0, maxLength);

      await supabase
        .from('tasks')
        .update({
          assigned_to_ids: finalUserIds,
          assigned_to_names: finalUserNames,
          assigned_to_id: finalUserIds.length === 1 ? finalUserIds[0] : null,
          assigned_at: finalUserIds.length > 0 ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('organization_id', organizationId);

      console.log('TaskAssignmentService: Cleaned up task assignment data');
    } catch (error) {
      console.error('TaskAssignmentService: Error cleaning up assignment:', error);
    }
  }
}
