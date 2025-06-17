
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from 'react-hook-form';

interface TaskDescriptionFieldProps {
  form: UseFormReturn<any>;
}

const TaskDescriptionField: React.FC<TaskDescriptionFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-base font-medium">Description</Label>
      <Textarea
        id="description"
        placeholder="Provide detailed information about the task..."
        className="min-h-[120px] border-2 focus:border-primary resize-none"
        {...form.register('description')}
      />
    </div>
  );
};

export default TaskDescriptionField;
