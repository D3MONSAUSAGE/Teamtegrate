
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Task } from '@/types';
import { TaskPriorityField } from '@/components/task/form/TaskPriorityField';
import { TaskProjectField } from '@/components/task/form/TaskProjectField';
import TaskDeadlinePicker from '@/components/task/form/TaskDeadlinePicker';

interface TaskDetailsSectionProps {
  register: any;
  errors: any;
  editingTask?: Task;
  currentProjectId?: string;
  setValue: (name: string, value: any) => void;
  selectedDate: Date | undefined;
  selectedTime: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({
  register,
  errors,
  editingTask,
  currentProjectId,
  setValue,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Task Title <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Enter task title"
          {...register("title", { required: "Title is required" })}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <span className="text-xs text-red-500">{errors.title.message}</span>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          rows={3}
          {...register("description")}
        />
      </div>

      <TaskPriorityField 
        register={register} 
        errors={errors}
      />
      
      <TaskDeadlinePicker
        date={selectedDate}
        timeInput={selectedTime}
        onDateChange={onDateChange}
        onTimeChange={onTimeChange}
        error={errors.deadline?.message}
      />

      <TaskProjectField
        register={register}
        errors={errors}
        editingTask={editingTask}
        currentProjectId={currentProjectId}
      />

      <div>
        <Label htmlFor="cost">Cost (optional)</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register("cost")}
        />
      </div>
    </>
  );
};
