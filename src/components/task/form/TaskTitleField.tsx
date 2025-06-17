
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TaskTitleFieldProps {
  form: UseFormReturn<any>;
}

const TaskTitleField: React.FC<TaskTitleFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title" className="text-base font-medium">
        Title <span className="text-red-500">*</span>
      </Label>
      <Input
        id="title"
        placeholder="Enter a clear, descriptive task title..."
        className="text-base h-12 border-2 focus:border-primary"
        {...form.register('title', { required: "Title is required" })}
      />
      {form.formState.errors.title && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {String(form.formState.errors.title.message || 'Title is required')}
        </p>
      )}
    </div>
  );
};

export default TaskTitleField;
