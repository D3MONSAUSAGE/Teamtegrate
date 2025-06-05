
import React from 'react';
import { Project, Task } from '@/types';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import TaskAssigneeSelect from './form/TaskAssigneeSelect';
import { useUsers } from '@/hooks/useUsers';
import { TaskPriorityField } from './form/TaskPriorityField';
import { TaskProjectField } from './form/TaskProjectField';

interface TaskFormFieldsProps {
  register: any;
  errors: any;
  setValue: any;
  selectedMember: string | undefined;
  setSelectedMember: (id: string | undefined) => void;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  date: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
}

const TaskFormFieldsWithAI: React.FC<TaskFormFieldsProps> = ({
  register,
  errors,
  setValue,
  selectedMember,
  setSelectedMember,
  projects,
  editingTask,
  currentProjectId,
  date,
  timeInput,
  onDateChange,
  onTimeChange
}) => {
  const { users, isLoading: loadingUsers } = useUsers();

  const handleUserAssignment = (userId: string) => {
    console.log('Assigning user:', userId);
    
    if (userId === "unassigned") {
      console.log('Setting user to unassigned');
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
      return;
    }
    
    const selectedUser = users.find(user => user.id === userId);
    console.log('Selected user:', selectedUser);
    
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name || selectedUser.email);
    }
  };

  // Create a handler function to properly handle time changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    // If e is a string, it's already the time value
    // If e is an event, extract the value from it
    const timeValue = typeof e === 'string' ? e : e.target.value;
    onTimeChange(timeValue);
  };

  React.useEffect(() => {
    if (editingTask) {
      console.log('TaskFormFieldsWithAI rendering with editingTask:', editingTask);
    }
  }, [editingTask]);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Enter task title"
          {...register('title', { required: "Title is required" })}
        />
        {errors.title && (
          <p className="text-sm font-medium text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          className="resize-none h-24"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskPriorityField 
          register={register}
          errors={errors}
          defaultValue={editingTask?.priority || "Medium"}
          setValue={setValue}
        />
        
        <TaskDeadlinePicker 
          date={date}
          timeInput={timeInput}
          onDateChange={onDateChange}
          onTimeChange={handleTimeChange}
          error={errors.deadline?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskProjectField 
          register={register}
          errors={errors}
          projects={projects}
          currentProjectId={currentProjectId}
          editingTask={editingTask}
          setValue={setValue}
        />
        
        <TaskAssigneeSelect 
          selectedMember={selectedMember || "unassigned"}
          onAssign={handleUserAssignment}
          users={users} 
          isLoading={loadingUsers}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          placeholder="Enter cost (optional)"
          {...register('cost')}
        />
      </div>
    </>
  );
};

export default TaskFormFieldsWithAI;
