
import React from 'react';
import { Task } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useTaskSubmission } from '@/hooks/useTaskSubmission';
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
  const { projects } = useProjects();
  const { users, isLoading: loadingUsers } = useOrganizationTeamMembers();
  
  const { submitTask } = useTaskSubmission();

  const handleSubmit = async (data: any, selectedUsers: any[]) => {
    const success = await submitTask(
      data,
      selectedUsers,
      data.deadline, // deadline is already combined with time in EnhancedCreateTaskDialog
      '', // timeInput not needed as deadline includes time
      editingTask,
      () => {
        onOpenChange(false);
        onTaskComplete?.();
      }
    );

    if (!success) {
      throw new Error('Failed to submit task');
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
    />
  );
};

export default CreateTaskDialogEnhanced;
