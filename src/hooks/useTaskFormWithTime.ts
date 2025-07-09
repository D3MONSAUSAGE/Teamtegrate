
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, TaskPriority, TaskFormValues } from '@/types/tasks';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  deadline: z.union([z.string(), z.date()]),
  projectId: z.string().optional(),
  cost: z.union([z.number(), z.string()]).optional(),
});

export const useTaskFormWithTime = (editingTask?: Task, currentProjectId?: string) => {
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editingTask?.deadline ? new Date(editingTask.deadline) : undefined
  );
  const [timeInput, setTimeInput] = useState<string>(
    editingTask?.deadline && typeof editingTask.deadline === 'string'
      ? new Date(editingTask.deadline).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
      : ''
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: editingTask?.deadline || new Date(),
      projectId: editingTask?.projectId || currentProjectId || 'none',
      cost: editingTask?.cost || 0,
      assignedToIds: editingTask?.assignedToIds || [],
      assignedToNames: editingTask?.assignedToNames || [],
    },
  });

  const { register, setValue, watch, formState: { errors }, reset, handleSubmit } = form;

  const handleDateChange = (date: Date | undefined) => {
    setDeadlineDate(date);
    if (date && timeInput) {
      const [hours, minutes] = timeInput.split(':');
      const newDateTime = new Date(date);
      newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      setValue('deadline', newDateTime);
    } else if (date) {
      setValue('deadline', date);
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeInput(time);
    if (deadlineDate && time) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(deadlineDate);
      newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      setValue('deadline', newDateTime);
    }
  };

  return {
    form,
    register,
    setValue,
    watch,
    errors,
    reset,
    handleSubmit,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange,
  };
};
