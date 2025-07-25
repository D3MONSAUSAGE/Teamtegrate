
import { useState } from 'react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

export const useTaskSubmission = () => {
  const { user } = useAuth();
  const { createTask, updateTask } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submitTask = async (
    taskData: any,
    selectedUsers: User[],
    deadline: Date | string,
    timeInput: string,
    editingTask?: Task,
    onSuccess?: () => void
  ): Promise<boolean> => {
    console.log('🎯 submitTask: Starting task submission with data:', {
      taskData,
      selectedUsers: selectedUsers.map(u => ({ id: u.id, name: u.name })),
      deadline,
      timeInput,
      isEditing: !!editingTask
    });

    if (!user?.organizationId) {
      console.error('❌ submitTask: Organization context required');
      toast.error('Organization context required');
      return false;
    }

    console.log('✅ submitTask: User organization check passed');

    let finalTaskData: any;

    try {
      setIsSubmitting(true);
      console.log('🔄 submitTask: Set isSubmitting to true');

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

      console.log('📅 submitTask: Final deadline:', finalDeadline);

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

      console.log('👥 submitTask: Assignment data prepared:', assignmentData);

      finalTaskData = {
        ...taskData,
        ...assignmentData,
        deadline: finalDeadline,
        userId: user.id,
        organizationId: user.organizationId
      };

      console.log('📋 submitTask: Final task data:', finalTaskData);

      if (editingTask) {
        console.log('📝 submitTask: Updating existing task:', editingTask.id);
        await updateTask(editingTask.id, finalTaskData);
        console.log('✅ submitTask: Task updated successfully');
        toast.success('Task updated successfully');
      } else {
        console.log('🆕 submitTask: Creating new task...');
        await createTask(finalTaskData);
        console.log('✅ submitTask: Task created successfully');
        toast.success('Task created successfully');
      }

      // Invalidate all relevant query caches to ensure dashboard updates
      console.log('🔄 submitTask: Invalidating query caches');
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks-my-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      
      // Invalidate specific user/organization queries
      await queryClient.invalidateQueries({ 
        queryKey: ['personal-tasks', user.organizationId, user.id] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['tasks-my-tasks', user.organizationId, user.id] 
      });

      console.log('🎉 submitTask: Calling onSuccess callback');
      onSuccess?.();
      console.log('✅ submitTask: Task submission completed successfully');
      return true;
    } catch (error: any) {
      console.error('💥 submitTask: Error saving task:', error);
      console.error('💥 submitTask: Error details:', {
        message: error?.message,
        stack: error?.stack,
        taskData: finalTaskData
      });
      
      // Show error toast with specific message
      const errorMessage = error?.message || 'Failed to save task';
      toast.error(errorMessage);
      console.log('❌ submitTask: Task submission failed');
      return false;
    } finally {
      console.log('🔄 submitTask: Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return {
    submitTask,
    isSubmitting
  };
};
