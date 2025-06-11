
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Task, TaskPriority, TaskFormValues } from '@/types/tasks';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';

export const useTaskFormWithTime = (
  editingTask?: Task, 
  currentProjectId?: string,
  onTaskComplete?: () => void
) => {
  const { user } = useAuth();
  const { addTask, updateTask } = useTask();
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );

  // Initialize date and time from deadline
  const initializeDateTime = () => {
    if (!editingTask?.deadline) return { dateValue: undefined, timeValue: '' };
    
    const deadlineDate = editingTask.deadline instanceof Date 
      ? editingTask.deadline
      : new Date(editingTask.deadline);
    
    if (isNaN(deadlineDate.getTime())) return { dateValue: undefined, timeValue: '' };
    
    // Format the time as HH:MM
    const hours = deadlineDate.getHours().toString().padStart(2, '0');
    const minutes = deadlineDate.getMinutes().toString().padStart(2, '0');
    
    return { 
      dateValue: deadlineDate,
      timeValue: `${hours}:${minutes}`
    };
  };
  
  const { dateValue: initialDate, timeValue: initialTime } = initializeDateTime();
  
  // State for date and time inputs
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime || '');

  // Configure form with proper defaults
  const {
    register,
    handleSubmit, 
    formState: { errors }, 
    reset, 
    setValue,
    watch
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: '',  // We'll handle this with date and time separately
      projectId: editingTask?.projectId || currentProjectId || '',
      cost: editingTask?.cost?.toString() || '',
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || ''
    },
  });

  // Submit handler
  const handleFormSubmit = async (data: TaskFormValues) => {
    if (!user || !user.organizationId) return;
    
    // Combine date and time into a single Date object
    let deadline: Date;
    
    if (selectedDate) {
      deadline = new Date(selectedDate);
      
      if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        deadline.setHours(hours || 0);
        deadline.setMinutes(minutes || 0);
      }
    } else {
      deadline = new Date();  // Default to current date/time if not set
    }
    
    // Convert cost string to number or undefined
    const cost = data.cost ? Number(data.cost) : undefined;
    
    // Prepare form data
    const formData = {
      ...data,
      deadline,
      cost,
      assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
    };

    try {
      // Create or edit task
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await addTask({
          ...formData,
          status: 'To Do' as const,
          userId: user.id,
          projectId: data.projectId === "none" ? undefined : data.projectId,
          organizationId: user.organizationId,
          assignedToIds: selectedMember && selectedMember !== "unassigned" ? [selectedMember] : [],
          assignedToNames: data.assignedToName ? [data.assignedToName] : [],
        });
      }

      // Reset form and call completion callback
      reset();
      setSelectedMember(undefined);
      if (onTaskComplete) onTaskComplete();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
  };

  return {
    register,
    errors,
    reset,
    setValue,
    watch,
    selectedMember,
    setSelectedMember,
    selectedDate,
    selectedTime,
    handleDateChange,
    handleTimeChange,
    handleFormSubmit: handleSubmit(handleFormSubmit)
  };
};
