
import React from 'react';
import { Project, Task } from '@/types';
import TaskTitleField from './form/TaskTitleField';
import TaskDescriptionField from './form/TaskDescriptionField';
import { TaskProjectField } from './form/TaskProjectField';
import TaskAssigneeSelect from './form/TaskAssigneeSelect';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import { TaskPriorityField } from './form/TaskPriorityField';
import { useUsers } from '@/hooks/useUsers';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  // Log when component renders with editing task
  React.useEffect(() => {
    if (editingTask) {
      console.log('TaskFormFieldsWithAI rendering with editingTask:', editingTask);
    }
  }, [editingTask]);

  // Create a handler function to properly handle time changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    // If e is a string, it's already the time value
    // If e is an event, extract the value from it
    const timeValue = typeof e === 'string' ? e : e.target.value;
    onTimeChange(timeValue);
  };

  return (
    <>
      <TaskTitleField 
        register={register}
        errors={errors}
        setValue={setValue}
      />

      <TaskDescriptionField 
        register={register}
        setValue={setValue}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TaskProjectField 
          register={register}
          errors={errors}
          projects={projects}
          currentProjectId={currentProjectId}
          editingTask={editingTask}
          setValue={setValue}
        />
        
        <TaskAssigneeSelect 
          selectedMember={selectedMember}
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
