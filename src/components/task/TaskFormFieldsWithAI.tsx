
import React from 'react';
import { Project, Task } from '@/types';
import TaskTitleField from './form/TaskTitleField';
import TaskDescriptionField from './form/TaskDescriptionField';
import TaskProjectField from './form/TaskProjectField';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import TaskPriorityField from './form/TaskPriorityField';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskFormFieldsProps {
  register: any;
  errors: any;
  setValue: any;
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
  setSelectedMember,
  projects,
  editingTask,
  currentProjectId,
  date,
  timeInput,
  onDateChange,
  onTimeChange
}) => {
  // Log when component renders with editing task
  React.useEffect(() => {
    if (editingTask) {
      console.log('TaskFormFieldsWithAI rendering with editingTask:', editingTask);
    }
  }, [editingTask]);

  return (
    <div className="space-y-4">
      <TaskTitleField 
        register={register}
        errors={errors}
        setValue={setValue}
      />

      <TaskDescriptionField 
        register={register}
        setValue={setValue}
      />

      <div className="grid grid-cols-1 gap-3">
        <TaskPriorityField 
          defaultValue={editingTask?.priority || "Medium"}
          setValue={setValue}
        />
        
        <TaskDeadlinePicker 
          date={date}
          timeInput={timeInput}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          error={errors.deadline?.message}
        />
      </div>

      <TaskProjectField 
        projects={projects}
        currentProjectId={currentProjectId}
        editingTask={editingTask}
        setValue={setValue}
      />

      <div className="space-y-1">
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter cost (optional)"
          {...register('cost')}
        />
      </div>
    </div>
  );
};

export default TaskFormFieldsWithAI;
