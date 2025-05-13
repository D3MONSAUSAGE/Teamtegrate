
import { useState, useEffect } from 'react';
import { useTaskForm } from './useTaskForm';
import { Task } from '@/types';
import { format } from 'date-fns';

export const useTaskFormWithTime = (editingTask?: Task, currentProjectId?: string) => {
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
    prepareDateWithTime
  };
};
