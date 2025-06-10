
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Task, TaskPriority } from '@/types';
import { format } from 'date-fns';

export const useTaskFormWithAI = (editingTask?: Task, currentProjectId?: string) => {
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );
  
  // Add deadline state management
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editingTask?.deadline ? new Date(editingTask.deadline) : new Date()
  );
  
  const [timeInput, setTimeInput] = useState(
    editingTask?.deadline ? format(new Date(editingTask.deadline), 'HH:mm') : "12:00"
  );

  // Set default values for the form including multi-assignment fields
  const form = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: editingTask?.deadline ? new Date(editingTask.deadline).toISOString() : new Date().toISOString(),
      projectId: editingTask?.projectId || currentProjectId || '',
      cost: editingTask?.cost !== undefined ? editingTask.cost : '',
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || '',
      assignedToIds: editingTask?.assignedToIds || [],
      assignedToNames: editingTask?.assignedToNames || []
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
      setValue('assignedToIds', editingTask.assignedToIds || []);
      setValue('assignedToNames', editingTask.assignedToNames || []);
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
    } else {
      setValue('deadline', date.toISOString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    // Handle both string input and event object
    const newTimeInput = typeof e === 'string' ? e : e.target.value;
    setTimeInput(newTimeInput);
    
    if (deadlineDate && newTimeInput) {
      const [hours, minutes] = newTimeInput.split(':').map(Number);
      const newDate = new Date(deadlineDate);
      newDate.setHours(hours || 0, minutes || 0);
      setValue('deadline', newDate.toISOString());
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
