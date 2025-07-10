
import React, { useEffect } from 'react';
import { Task } from '@/types';
import { TaskFormData } from '@/types/forms';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useTaskSubmission } from '@/hooks/useTaskSubmission';
import { useAuth } from '@/contexts/AuthContext';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';
import EnhancedCreateTaskDialog from './task/EnhancedCreateTaskDialog';

interface CreateTaskDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
}

const CreateTaskDialogEnhanced: React.FC<CreateTaskDialogEnhancedProps> = ({
  open,
  onOpenChange,
  editingTask,
  currentProjectId,
  onTaskComplete,
}) => {
  const { user: currentUser } = useAuth();
  const { projects } = useProjects();
  
  // For managers, use organization team members (current behavior)
  // For admins and superadmins, the enhanced assignment component will handle user loading
  const { users, isLoading: loadingUsers, refetch: refetchUsers } = useOrganizationTeamMembers();
  
  const { submitTask } = useTaskSubmission();

  // Force refresh users when dialog opens to ensure latest data
  useEffect(() => {
    if (open) {
      devLog.taskOperation('Dialog opened, refreshing users');
      refetchUsers();
    }
  }, [open, refetchUsers]);

  const handleSubmit = async (data: TaskFormData, selectedUsers: any[]) => {
    devLog.taskOperation('handleSubmit called', {
      data,
      selectedUsers: selectedUsers.map(u => ({ id: u.id, name: u.name })),
      editingTask: !!editingTask,
      currentProjectId
    });

    try {
      const success = await submitTask(
        data,
        selectedUsers,
        data.deadline, // deadline is already combined with time in EnhancedCreateTaskDialog
        '', // timeInput not needed as deadline includes time
        editingTask,
        () => {
          devLog.taskOperation('Task submission success callback');
          logger.userAction('Task created/updated successfully');
          onOpenChange(false);
          onTaskComplete?.();
        }
      );

      if (!success) {
        logger.error('Task submission failed');
        throw new Error('Failed to submit task');
      }

      devLog.taskOperation('Task submission completed successfully');
    } catch (error) {
      logger.error('Error in handleSubmit', error);
      throw error; // Re-throw to let the dialog handle it
    }
  };

  return (
    <EnhancedCreateTaskDialog
      open={open}
      onOpenChange={onOpenChange}
      editingTask={editingTask}
      currentProjectId={currentProjectId}
      onTaskComplete={onTaskComplete}
      projects={projects}
      users={users}
      loadingUsers={loadingUsers}
      onSubmit={handleSubmit}
      currentUserRole={currentUser?.role}
    />
  );
};

export default CreateTaskDialogEnhanced;
