
import React, { useEffect } from 'react';
import { Task } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useTaskSubmission } from '@/hooks/useTaskSubmission';
import { useAuth } from '@/contexts/AuthContext';
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
      console.log('CreateTaskDialogEnhanced: Dialog opened, refreshing users...');
      refetchUsers();
    }
  }, [open, refetchUsers]);

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
      currentUserRole={currentUser?.role}
    />
  );
};

export default CreateTaskDialogEnhanced;
