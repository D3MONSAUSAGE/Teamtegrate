
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { User, Task } from '@/types';

export const useTaskSubmission = () => {
  const { user } = useAuth();
  const { addTask, updateTask } = useTask();

  const submitTask = async (
    data: any,
    selectedUsers: User[],
    deadlineDate: Date | undefined,
    timeInput: string,
    editingTask?: Task,
    onSuccess?: () => void
  ) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return false;
    }

    if (!deadlineDate) {
      toast.error('Please select a deadline');
      return false;
    }

    try {
      // Combine date and time
      const [hours, minutes] = timeInput.split(':').map(Number);
      const deadline = new Date(deadlineDate);
      deadline.setHours(hours, minutes, 0, 0);

      // Prepare assignment data
      const assignmentData = selectedUsers.length > 0 ? {
        assignedToIds: selectedUsers.map(u => u.id),
        assignedToNames: selectedUsers.map(u => u.name || u.email),
        // For single assignment, also populate single fields for backward compatibility
        ...(selectedUsers.length === 1 && {
          assignedToId: selectedUsers[0].id,
          assignedToName: selectedUsers[0].name || selectedUsers[0].email
        })
      } : {};

      const taskData = {
        ...data,
        deadline,
        organizationId: user.organizationId,
        ...assignmentData,
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast.success('Task updated successfully!');
      } else {
        await addTask(taskData);
        toast.success('Task created successfully!');
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task');
      return false;
    }
  };

  return { submitTask };
};
