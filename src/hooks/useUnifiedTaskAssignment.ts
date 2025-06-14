
import { useState } from 'react';
import { Task, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { TaskAssignmentService } from '@/services/taskAssignmentService';

export const useUnifiedTaskAssignment = () => {
  const { user } = useAuth();
  const [isAssigning, setIsAssigning] = useState(false);

  const assignTask = async (
    taskId: string,
    selectedUsers: User[],
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!user?.organizationId || selectedUsers.length === 0) {
      return false;
    }

    setIsAssigning(true);
    
    try {
      const userIds = selectedUsers.map(u => u.id);
      const userNames = selectedUsers.map(u => u.name || u.email);

      const success = await TaskAssignmentService.assignTask({
        taskId,
        userIds,
        userNames,
        organizationId: user.organizationId,
        currentUserId: user.id
      });

      if (success && onSuccess) {
        onSuccess();
      }

      return success;
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignTask = async (
    taskId: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!user?.organizationId) {
      return false;
    }

    setIsAssigning(true);

    try {
      const success = await TaskAssignmentService.unassignTask(
        taskId,
        user.organizationId
      );

      if (success && onSuccess) {
        onSuccess();
      }

      return success;
    } finally {
      setIsAssigning(false);
    }
  };

  const getAssignmentDisplay = (task: Task): string => {
    return TaskAssignmentService.getAssignmentDisplay(task);
  };

  const cleanupTaskAssignment = async (taskId: string): Promise<void> => {
    if (!user?.organizationId) return;
    
    await TaskAssignmentService.cleanupTaskAssignment(
      taskId,
      user.organizationId
    );
  };

  return {
    assignTask,
    unassignTask,
    getAssignmentDisplay,
    cleanupTaskAssignment,
    isAssigning,
    TaskAssignmentService
  };
};
