
import React from 'react';
import { Project, Task } from '@/types';
import TaskTitleField from './form/TaskTitleField';
import TaskDescriptionField from './form/TaskDescriptionField';
import TaskProjectField from './form/TaskProjectField';
import TaskAssigneeSelect from './form/TaskAssigneeSelect';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import { useUsers } from '@/hooks/useUsers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name);
    } else if (userId === "unassigned") {
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
    }
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
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            defaultValue={editingTask?.priority || "Medium"} 
            onValueChange={(value) => setValue('priority', value)}
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
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          error={errors.deadline?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TaskProjectField 
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
