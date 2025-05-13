
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TaskDeadlineWithTime from '@/components/task/form/TaskDeadlineWithTime';
import TaskPriorityField from '@/components/task/form/TaskPriorityField';
import TaskProjectField from '@/components/task/form/TaskProjectField';
import { Task } from '@/types';
import { Project } from '@/types';

interface TaskDetailsTabProps {
  register: any;
  errors: any;
  projects: Project[];
  currentProjectId?: string;
  editingTask?: Task;
  timeInput: string;
  setTimeInput: (time: string) => void;
  watch: any;
  setValue: (name: string, value: any) => void;
}

const TaskDetailsTab: React.FC<TaskDetailsTabProps> = ({
  register,
  errors,
  projects,
  currentProjectId,
  editingTask,
  timeInput,
  setTimeInput,
  watch,
  setValue
}) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Task title"
          {...register("title", { required: "Title is required" })}
          className="w-full"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="w-full min-h-[100px] rounded-md border border-input p-2"
          placeholder="Task description"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskPriorityField 
          defaultValue={editingTask?.priority || "Medium"}
          setValue={setValue}
        />

        <TaskDeadlineWithTime 
          register={register}
          timeInput={timeInput}
          onTimeChange={handleTimeChange}
          watch={watch}
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
          placeholder="Enter cost (optional)"
          {...register('cost')}
        />
      </div>
    </>
  );
};

export default TaskDetailsTab;
