
import { useState } from 'react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useTaskSubmission = () => {
  const { user } = useAuth();
  const { addTask, updateTask } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitTask = async (
    taskData: any,
    selectedUsers: User[],
    deadline: Date | string,
    timeInput: string, // This is now optional since deadline can include time
    editingTask?: Task,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return false;
    }

    try {
      setIsSubmitting(true);

      // Prepare deadline - use provided deadline if it's already a Date with time
      let finalDeadline: Date;
      if (deadline instanceof Date) {
        finalDeadline = deadline;
      } else {
        finalDeadline = new Date(deadline);
        // If timeInput is provided and deadline doesn't have time, add it
        if (timeInput && finalDeadline.getHours() === 0 && finalDeadline.getMinutes() === 0) {
          const [hours, minutes] = timeInput.split(':');
          finalDeadline.setHours(parseInt(hours), parseInt(minutes));
        }
      }

      // Prepare assignment data
      const assignmentData = selectedUsers.length > 0 ? {
        assignedToIds: selectedUsers.map(user => user.id),
        assignedToNames: selectedUsers.map(user => user.name || user.email),
        // For backward compatibility with single assignment
        assignedToId: selectedUsers.length === 1 ? selectedUsers[0].id : undefined,
        assignedToName: selectedUsers.length === 1 ? (selectedUsers[0].name || selectedUsers[0].email) : undefined
      } : {
        assignedToIds: [],
        assignedToNames: [],
        assignedToId: undefined,
        assignedToName: undefined
      };

      const finalTaskData = {
        ...taskData,
        ...assignmentData,
        deadline: finalDeadline,
        userId: user.id,
        organizationId: user.organizationId
      };

      if (editingTask) {
        await updateTask(editingTask.id, finalTaskData);
        toast.success('Task updated successfully');
      } else {
        await addTask(finalTaskData);
        toast.success('Task created successfully');
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(`Failed to ${editingTask ? 'update' : 'create'} task`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitTask,
    isSubmitting
  };
};
