
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Task, TaskPriority } from '@/types';

export const useTaskForm = (editingTask?: Task, currentProjectId?: string) => {
  // Track selected team member for assignment
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );

  // Format deadline for the form
  let defaultDeadline = '';
  if (editingTask?.deadline) {
    // Handle date conversion properly
    const deadlineDate = editingTask.deadline instanceof Date 
      ? editingTask.deadline 
      : new Date(editingTask.deadline);
      
    if (!isNaN(deadlineDate.getTime())) {
      // Format as ISO string for input
      defaultDeadline = deadlineDate.toISOString().substring(0, 16);
    }
  }

  // Set up form with proper defaults
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium' as TaskPriority,
      deadline: defaultDeadline,
      projectId: editingTask?.projectId || currentProjectId || '',
      cost: editingTask?.cost?.toString() || '',
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || ''
    },
  });

  const watchedValues = watch();

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch: watchedValues,
    selectedMember,
    setSelectedMember
  };
};
