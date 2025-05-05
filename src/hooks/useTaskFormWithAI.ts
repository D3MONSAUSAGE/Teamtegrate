
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Task } from '@/types';
import { format, isValid, parseISO } from 'date-fns';

export const useTaskFormWithAI = (editingTask?: Task, currentProjectId?: string) => {
  // Get initial deadline date from editing task or use current date
  const getInitialDeadline = (): Date => {
    if (editingTask?.deadline) {
      const date = new Date(editingTask.deadline);
      return isValid(date) ? date : new Date();
    }
    const now = new Date();
    now.setHours(12, 0, 0, 0); // Set default time to noon
    return now;
  };
  
  // Get initial time from editing task or use noon
  const getInitialTimeInput = (): string => {
    if (editingTask?.deadline) {
      const date = new Date(editingTask.deadline);
      return isValid(date) ? format(date, 'HH:mm') : "12:00";
    }
    return "12:00";
  };

  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );
  
  // Initialize deadline state with proper validation
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(getInitialDeadline());
  const [timeInput, setTimeInput] = useState<string>(getInitialTimeInput());

  // Set default values for the form with proper ISO date strings
  const form = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: deadlineDate ? deadlineDate.toISOString() : new Date().toISOString(),
      projectId: editingTask?.projectId || currentProjectId || '',
      cost: editingTask?.cost !== undefined ? editingTask.cost : '',
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || ''
    }
  });
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = form;
  
  // Update form fields when editingTask or currentProjectId changes
  useEffect(() => {
    console.log('useTaskFormWithAI effect triggered', { editingTask });
    
    if (editingTask) {
      try {
        const taskDate = new Date(editingTask.deadline);
        if (isValid(taskDate)) {
          setDeadlineDate(taskDate);
          setTimeInput(format(taskDate, 'HH:mm'));
          setValue('deadline', taskDate.toISOString());
        } else {
          // Handle invalid date
          console.warn('Invalid date in editing task:', editingTask.deadline);
          const now = new Date();
          now.setHours(12, 0, 0, 0);
          setDeadlineDate(now);
          setTimeInput('12:00');
          setValue('deadline', now.toISOString());
        }
        
        setValue('title', editingTask.title);
        setValue('description', editingTask.description || '');
        setValue('priority', editingTask.priority);
        setValue('projectId', editingTask.projectId || '');
        setValue('cost', editingTask.cost !== undefined ? editingTask.cost : '');
        setSelectedMember(editingTask.assignedToId);
        setValue('assignedToId', editingTask.assignedToId || '');
        setValue('assignedToName', editingTask.assignedToName || '');
        
        console.log('Form values set for editing task:', {
          title: editingTask.title,
          deadline: editingTask.deadline,
          assignedToId: editingTask.assignedToId,
          assignedToName: editingTask.assignedToName
        });
      } catch (error) {
        console.error('Error setting form values:', error);
        // Set fallback values
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        setDeadlineDate(now);
        setTimeInput('12:00');
      }
    } else {
      // For new tasks, initialize with current date and noon
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      setDeadlineDate(today);
      setTimeInput("12:00");
      setValue('deadline', today.toISOString());
      
      if (currentProjectId) {
        setValue('projectId', currentProjectId);
      }
    }
  }, [editingTask, currentProjectId, setValue]);
  
  // Improved date handler that properly maintains time parts
  const handleDateChange = (date: Date | undefined) => {
    if (!date || !isValid(date)) return;
    
    setDeadlineDate(date);
    
    // Preserve time if time was already set
    if (timeInput) {
      try {
        const [hours, minutes] = timeInput.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours || 12, minutes || 0, 0, 0);
        setValue('deadline', newDate.toISOString());
        console.log(`Date changed to ${date.toDateString()}, new deadline with time:`, newDate.toISOString());
      } catch (error) {
        console.error('Error applying time to date:', error);
        setValue('deadline', date.toISOString());
      }
    } else {
      // Default to noon if no time set
      const newDate = new Date(date);
      newDate.setHours(12, 0, 0, 0);
      setValue('deadline', newDate.toISOString());
    }
  };

  // Improved time handler that properly updates the full date
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeInput = e.target.value;
    setTimeInput(newTimeInput);
    
    if (deadlineDate && newTimeInput) {
      try {
        const [hours, minutes] = newTimeInput.split(':').map(Number);
        const newDate = new Date(deadlineDate);
        newDate.setHours(hours || 12, minutes || 0, 0, 0);
        setValue('deadline', newDate.toISOString());
        console.log(`Time updated to ${newTimeInput}, new deadline with date:`, newDate.toISOString());
      } catch (error) {
        console.error('Error applying time to date:', error);
      }
    }
  };

  return {
    form,
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange
  };
};
