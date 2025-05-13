
import { useState, useEffect } from 'react';
import { useTaskForm } from './useTaskForm';
import { Task } from '@/types';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';

export const useTaskFormWithTime = (editingTask?: Task, currentProjectId?: string) => {
  const { user } = useAuth();
  const { addTask, updateTask } = useTask();
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    watch = () => ''
  } = useTaskForm(editingTask, currentProjectId);

  // Add time state
  const [timeInput, setTimeInput] = useState('12:00');
  
  // Set initial time if editing a task with a deadline
  useEffect(() => {
    if (editingTask?.deadline) {
      const date = new Date(editingTask.deadline);
      setTimeInput(format(date, 'HH:mm'));
    }
  }, [editingTask]);

  const resetForm = () => {
    reset();
    setSelectedMember(undefined);
    setTimeInput('12:00');
  };

  const prepareDateWithTime = (deadline: string | undefined) => {
    if (!deadline) return undefined;
    
    // Create a deadline with the time component
    const deadlineDate = new Date(deadline);
    
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      deadlineDate.setHours(hours, minutes);
    }
    
    return deadlineDate;
  };

  const handleFormSubmit = (data: any, onClose: () => void) => {
    // Get deadline with time component
    const deadlineDate = prepareDateWithTime(data.deadline);
    const isEditMode = !!editingTask;

    if (isEditMode && editingTask) {
      updateTask(editingTask.id, {
        ...data,
        deadline: deadlineDate,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName
      });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: deadlineDate,
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName,
        cost: data.cost || 0
      });
    }
    onClose();
    resetForm();
  };

  return {
    register,
    handleSubmit,
    errors,
    reset: resetForm,
    setValue,
    selectedMember,
    setSelectedMember,
    watch,
    timeInput,
    setTimeInput,
    prepareDateWithTime,
    handleFormSubmit
  };
};
