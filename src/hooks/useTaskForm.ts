
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Task, TaskPriority } from '@/types';

export const useTaskForm = (editingTask?: Task, currentProjectId?: string) => {
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );

  // Set default values for the form, with ISO string for deadline
  const defaultDeadline = editingTask?.deadline 
    ? new Date(editingTask.deadline).toISOString()
    : '';

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium' as TaskPriority,
      deadline: defaultDeadline,
      projectId: editingTask?.projectId || currentProjectId || '',
      cost: editingTask?.cost || '',
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || ''
    },
  });

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    watch // Ensure watch is properly returned as a function
  };
};
