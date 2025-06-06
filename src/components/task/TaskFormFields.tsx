
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Task, AppUser } from '@/types';
import { TaskFormValues } from '@/types/tasks';
import TaskTitleField from './form/TaskTitleField';
import TaskDescriptionField from './form/TaskDescriptionField';
import { TaskPriorityField } from './form/TaskPriorityField';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import { TaskProjectField } from './form/TaskProjectField';
import TaskAssignmentSection from './form/TaskAssignmentSection';
import { useTask } from '@/contexts/task';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  deadline: z.string().min(1, 'Deadline is required'),
  projectId: z.string().optional(),
  cost: z.number().optional(),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  assignedToIds: z.array(z.string()).optional(),
  assignedToNames: z.array(z.string()).optional(),
});

interface TaskFormFieldsProps {
  onSubmit: (values: TaskFormValues) => Promise<void>;
  editingTask?: Task;
  isLoading: boolean;
  users: AppUser[];
  usersLoading?: boolean;
  multiSelect: boolean;
  onMultiSelectChange: (multiSelect: boolean) => void;
  currentProjectId?: string;
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  onSubmit,
  editingTask,
  isLoading,
  users = [],
  usersLoading = false,
  multiSelect,
  onMultiSelectChange,
  currentProjectId
}) => {
  const { projects } = useTask();
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeInput, setTimeInput] = useState('');

  console.log('TaskFormFields - users:', users, 'usersLoading:', usersLoading, 'multiSelect:', multiSelect);

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: editingTask?.deadline ? new Date(editingTask.deadline).toISOString().slice(0, 16) : '',
      projectId: currentProjectId || editingTask?.projectId || '',
      cost: editingTask?.cost || 0,
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || '',
      assignedToIds: editingTask?.assignedToIds || [],
      assignedToNames: editingTask?.assignedToNames || [],
    },
  });

  // Initialize selected members from editing task
  useEffect(() => {
    if (editingTask) {
      if (editingTask.assignedToIds && editingTask.assignedToIds.length > 0) {
        setSelectedMembers(editingTask.assignedToIds);
        setSelectedMember('');
        onMultiSelectChange(true);
      } else if (editingTask.assignedToId) {
        setSelectedMember(editingTask.assignedToId);
        setSelectedMembers([]);
        onMultiSelectChange(false);
      }

      // Initialize date and time from deadline
      if (editingTask.deadline) {
        const deadline = new Date(editingTask.deadline);
        setSelectedDate(deadline);
        setTimeInput(deadline.toTimeString().slice(0, 5));
      }
    }
  }, [editingTask, onMultiSelectChange]);

  const handleFormSubmit = async (values: TaskFormValues) => {
    const submissionValues = { ...values };
    
    if (multiSelect) {
      submissionValues.assignedToIds = selectedMembers;
      submissionValues.assignedToNames = selectedMembers.map(id => {
        const user = safeUsers.find(u => u.id === id);
        return user?.name || '';
      }).filter(Boolean);
      // Clear single assignment fields when using multi-select
      submissionValues.assignedToId = undefined;
      submissionValues.assignedToName = undefined;
    } else {
      submissionValues.assignedToId = selectedMember || undefined;
      submissionValues.assignedToName = selectedMember ? safeUsers.find(u => u.id === selectedMember)?.name : undefined;
      // Clear multi assignment fields when using single select
      submissionValues.assignedToIds = [];
      submissionValues.assignedToNames = [];
    }

    await onSubmit(submissionValues);
  };

  const handleAssign = (userId: string) => {
    setSelectedMember(userId);
    form.setValue('assignedToId', userId);
    const user = safeUsers.find(u => u.id === userId);
    if (user) {
      form.setValue('assignedToName', user.name);
    }
  };

  const handleMembersChange = (memberIds: string[]) => {
    console.log('TaskFormFields - handleMembersChange called with:', memberIds);
    setSelectedMembers(memberIds);
    form.setValue('assignedToIds', memberIds);
    const memberNames = memberIds.map(id => {
      const user = safeUsers.find(u => u.id === id);
      return user?.name || '';
    }).filter(Boolean);
    form.setValue('assignedToNames', memberNames);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    updateDeadline(date, timeInput);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTimeInput(time);
    updateDeadline(selectedDate, time);
  };

  const updateDeadline = (date: Date | undefined, time: string) => {
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const deadline = new Date(date);
      deadline.setHours(parseInt(hours), parseInt(minutes));
      form.setValue('deadline', deadline.toISOString().slice(0, 16));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <TaskTitleField 
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
        />
        <TaskDescriptionField 
          register={form.register}
          setValue={form.setValue}
        />
        <TaskPriorityField 
          register={form.register}
          errors={form.formState.errors}
          defaultValue={editingTask?.priority}
          setValue={form.setValue}
        />
        <TaskDeadlinePicker
          date={selectedDate}
          timeInput={timeInput}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
          error={form.formState.errors.deadline?.message}
        />
        <TaskProjectField 
          register={form.register}
          errors={form.formState.errors}
          editingTask={editingTask}
          currentProjectId={currentProjectId}
          projects={projects}
          setValue={form.setValue}
        />
        
        <TaskAssignmentSection
          selectedMember={selectedMember}
          selectedMembers={selectedMembers}
          onAssign={handleAssign}
          onMembersChange={handleMembersChange}
          users={safeUsers}
          isLoading={usersLoading}
          multiSelect={multiSelect}
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMultiSelectChange(!multiSelect)}
          >
            {multiSelect ? 'Switch to Single Assignment' : 'Switch to Multiple Assignment'}
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskFormFields;
