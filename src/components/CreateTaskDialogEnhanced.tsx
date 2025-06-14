
import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Task } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import useTeamMembers from '@/hooks/useTeamMembers';
import { convertTeamMembersToUsers } from '@/utils/teamMemberConverter';
import { useTaskDialogState } from '@/hooks/useTaskDialogState';
import { useTaskSubmission } from '@/hooks/useTaskSubmission';
import TaskDialogContent from './task/dialog/TaskDialogContent';

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
  const { teamMembers, isLoading: loadingUsers } = useTeamMembers();
  
  // Convert TeamMember[] to User[] with required properties
  const users = convertTeamMembersToUsers(teamMembers);

  const {
    selectedUsers,
    setSelectedUsers,
    deadlineDate,
    setDeadlineDate,
    timeInput,
    setTimeInput,
    isSubmitting,
    setIsSubmitting,
    form
  } = useTaskDialogState({
    editingTask,
    currentProjectId,
    open,
    users
  });

  const { submitTask } = useTaskSubmission();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    const success = await submitTask(
      data,
      selectedUsers,
      deadlineDate,
      timeInput,
      editingTask,
      () => {
        onOpenChange(false);
        onTaskComplete?.();
      }
    );

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TaskDialogContent
        editingTask={editingTask}
        currentProjectId={currentProjectId}
        projects={projects}
        users={users}
        loadingUsers={loadingUsers}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
        deadlineDate={deadlineDate}
        timeInput={timeInput}
        onDateChange={setDeadlineDate}
        onTimeChange={setTimeInput}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        form={form}
      />
    </Dialog>
  );
};

export default CreateTaskDialogEnhanced;
