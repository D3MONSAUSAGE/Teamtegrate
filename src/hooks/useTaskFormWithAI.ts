
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Task } from '@/types';
import { format } from 'date-fns';

export const useTaskFormWithAI = (editingTask?: Task, currentProjectId?: string) => {
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );
  
  // Add deadline state management
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editingTask?.deadline ? new Date(editingTask.deadline) : new Date()
  );
  
  const [timeInput, setTimeInput] = useState(() => {
    if (editingTask?.deadline) {
      const date = new Date(editingTask.deadline);
      return format(date, 'HH:mm');
    }
    return "12:00";
  });

  // Set default values for the form
  const form = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: editingTask?.deadline ? new Date(editingTask.deadline).toISOString() : new Date().toISOString(),
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
      const taskDate = new Date(editingTask.deadline);
      setDeadlineDate(taskDate);
      setTimeInput(format(taskDate, 'HH:mm'));
      
      setValue('title', editingTask.title);
      setValue('description', editingTask.description || '');
      setValue('priority', editingTask.priority);
      setValue('deadline', new Date(editingTask.deadline).toISOString());
      setValue('projectId', editingTask.projectId || '');
      setValue('cost', editingTask.cost !== undefined ? editingTask.cost : '');
      setSelectedMember(editingTask.assignedToId);
      setValue('assignedToId', editingTask.assignedToId || '');
      setValue('assignedToName', editingTask.assignedToName || '');
      
      console.log('Form values set for editing task:', {
        title: editingTask.title,
        assignedToId: editingTask.assignedToId,
        assignedToName: editingTask.assignedToName
      });
    } else {
      // For new tasks
      const today = new Date();
      setDeadlineDate(today);
      setTimeInput("12:00");
      
      if (currentProjectId) {
        setValue('projectId', currentProjectId);
      }
    }
  }, [editingTask, currentProjectId, setValue]);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setDeadlineDate(date);
    
    // Preserve time if time was already set
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0);
      setValue('deadline', newDate.toISOString());
      console.log(`Date changed to ${date.toDateString()}, new deadline:`, newDate);
    } else {
      setValue('deadline', date.toISOString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeInput = e.target.value;
    setTimeInput(newTimeInput);
    
    if (deadlineDate && newTimeInput) {
      const [hours, minutes] = newTimeInput.split(':').map(Number);
      const newDate = new Date(deadlineDate);
      newDate.setHours(hours || 0, minutes || 0);
      setValue('deadline', newDate.toISOString());
      console.log(`Time updated to ${newTimeInput}, new deadline:`, newDate);
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
