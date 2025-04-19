import React from 'react';
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
import { Loader2 } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue: (name: string, value: any) => void;
  selectedMember: string | undefined;
  setSelectedMember: (value: string | undefined) => void;
  appUsers?: AppUser[];
  isLoadingUsers: boolean;
  projects: any[];
  editingTask?: any;
  currentProjectId?: string;
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  register,
  errors,
  setValue,
  selectedMember,
  setSelectedMember,
  appUsers,
  isLoadingUsers,
  projects,
  editingTask,
  currentProjectId
}) => {
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
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Select
          value={selectedMember}
          onValueChange={setSelectedMember}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assign to user (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                <span className="text-sm">Loading users...</span>
              </div>
            ) : appUsers && appUsers.length > 0 ? (
              appUsers.map(appUser => (
                <SelectItem key={appUser.id} value={appUser.id}>
                  {appUser.name} ({appUser.role})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-users" disabled>
                No users found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
        <Input
          id="deadline"
          type="datetime-local"
          {...register('deadline', { required: 'Deadline is required' })}
        />
        {errors.deadline && (
          <span className="text-xs text-red-500">{errors.deadline.message as string}</span>
        )}
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
