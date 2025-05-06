
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TaskDescriptionFieldProps {
  register: any;
  setValue: (name: string, value: any) => void;
}

const TaskDescriptionField: React.FC<TaskDescriptionFieldProps> = ({
  register,
  setValue
}) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        placeholder="Enter task description"
        className="resize-none h-24"
        {...register('description')}
      />
    </div>
  );
};

export default TaskDescriptionField;
