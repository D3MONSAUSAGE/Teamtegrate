import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskPriority } from '@/types';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { format } from 'date-fns';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import TaskAssigneeSelect from './form/TaskAssigneeSelect';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue: (name: string, value: any) => void;
  selectedMember: string | undefined;
  setSelectedMember: (value: string | undefined) => void;
  editingTask?: any;
  currentProjectId?: string;
  projects: any[];
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  register,
  errors,
  setValue,
  selectedMember,
  setSelectedMember,
  projects,
  editingTask,
  currentProjectId
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(
    editingTask ? new Date(editingTask.deadline) : undefined
  );
  
  const [timeInput, setTimeInput] = useState<string>(
    editingTask ? format(new Date(editingTask.deadline), 'HH:mm') : '12:00'
  );

  const { users, isLoading: loadingUsers } = useUsers();

  // Filter projects to only show those the user has access to
  const accessibleProjects = projects.filter(project => {
    if (!user) return false;
    
    const isManager = project.managerId === user.id;
    const isTeamMember = Array.isArray(project.teamMembers) && 
      project.teamMembers.includes(user.id);
    
    return isManager || isTeamMember;
  });

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    const [hours, minutes] = timeInput.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours || 0, minutes || 0, 0, 0);
    
    setDate(newDate);
    setValue('deadline', newDate.toISOString());
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
    
    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      setValue('deadline', newDate.toISOString());
    }
  };

  const handleUserAssignment = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name);
    } else {
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Task title"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && (
          <span className="text-xs text-red-500">{errors.title.message as string}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Task description"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
          <Select
            defaultValue={editingTask?.priority || 'Medium'}
            onValueChange={(value) => setValue('priority', value as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TaskDeadlinePicker
          date={date}
          timeInput={timeInput}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
          error={errors.deadline?.message as string}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectId">Project</Label>
          <Select
            defaultValue={editingTask?.projectId || currentProjectId || ''}
            onValueChange={(value) => setValue('projectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Project</SelectItem>
              {accessibleProjects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TaskAssigneeSelect
          selectedMember={selectedMember}
          onAssign={handleUserAssignment}
          users={users}
          isLoading={loadingUsers}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Task cost (optional)"
          {...register('cost')}
        />
      </div>
    </>
  );
};

export default TaskFormFields;
