
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskTitleFieldProps {
  register: any;
  errors: any;
  setValue: (name: string, value: any) => void;
}

const TaskTitleField: React.FC<TaskTitleFieldProps> = ({
  register,
  errors,
  setValue
}) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="title">Task Title</Label>
      <Input
        id="title"
        placeholder="Enter task title"
        {...register('title', { 
          required: "Title is required" 
        })}
      />
      {errors.title && (
        <p className="text-sm font-medium text-destructive">{errors.title.message}</p>
      )}
    </div>
  );
};

export default TaskTitleField;
