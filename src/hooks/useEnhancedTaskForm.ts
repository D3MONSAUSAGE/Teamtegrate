
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, TaskFormValues } from '@/types';
import { useTaskAssignmentValidation } from './useTaskAssignmentValidation';
import { useUsers } from './useUsers';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  deadline: z.union([z.string(), z.date()]),
  projectId: z.string().optional(),
  cost: z.union([z.number(), z.string()]).optional(),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  assignedToIds: z.array(z.string()).optional(),
  assignedToNames: z.array(z.string()).optional(),
});

export const useEnhancedTaskForm = (editingTask?: Task, currentProjectId?: string) => {
  const { users } = useUsers();
  const { 
    formatAssignmentData, 
    formatMultiAssignmentData,
    validateUserAssignment,
    validateMultipleAssignments
  } = useTaskAssignmentValidation();

  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId || "unassigned"
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    editingTask?.assignedToIds || []
  );
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editingTask?.deadline ? new Date(editingTask.deadline) : undefined
  );
  const [timeInput, setTimeInput] = useState<string>(
    editingTask?.deadline ? new Date(editingTask.deadline).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }) : ''
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
      assignedToId: editingTask?.assignedToId,
      assignedToName: editingTask?.assignedToName,
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

  const handleUserAssignment = (userId: string) => {
    if (!validateUserAssignment(userId, users)) {
      return; // Validation failed, error already shown
    }

    setSelectedMember(userId);
    const assignmentData = formatAssignmentData(userId, users);
    setValue('assignedToId', assignmentData.assignedToId);
    setValue('assignedToName', assignmentData.assignedToName);
  };

  const handleMembersChange = (memberIds: string[]) => {
    if (!validateMultipleAssignments(memberIds, users)) {
      return; // Validation failed, error already shown
    }

    setSelectedMembers(memberIds);
    const assignmentData = formatMultiAssignmentData(memberIds, users);
    setValue('assignedToIds', assignmentData.assignedToIds);
    setValue('assignedToNames', assignmentData.assignedToNames);
  };

  // Update form when editing task changes
  useEffect(() => {
    if (editingTask) {
      setSelectedMember(editingTask.assignedToId || "unassigned");
      setSelectedMembers(editingTask.assignedToIds || []);
      setDeadlineDate(editingTask.deadline ? new Date(editingTask.deadline) : undefined);
      setTimeInput(editingTask.deadline ? new Date(editingTask.deadline).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }) : '');
    }
  }, [editingTask]);

  return {
    form,
    register,
    setValue,
    watch,
    errors,
    reset,
    handleSubmit,
    selectedMember,
    setSelectedMember,
    selectedMembers,
    setSelectedMembers,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange,
    handleUserAssignment,
    handleMembersChange,
  };
};
