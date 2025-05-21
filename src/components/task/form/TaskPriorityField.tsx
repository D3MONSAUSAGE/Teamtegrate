
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TaskPriority } from '@/types';

interface TaskPriorityFieldProps {
  register: any;
  errors: any;
  defaultValue?: TaskPriority;
  setValue: any;
}

export const TaskPriorityField: React.FC<TaskPriorityFieldProps> = ({
  register,
  errors,
  defaultValue = "Medium",
  setValue
}) => {
  // Register the priority field with react-hook-form
  const { ref, ...rest } = register("priority", { required: "Priority is required" });
  
  // Handle radio option changes
  const handlePriorityChange = (value: string) => {
    setValue("priority", value as TaskPriority, { shouldValidate: true });
  };

  React.useEffect(() => {
    if (defaultValue) {
      setValue("priority", defaultValue);
    }
  }, [defaultValue, setValue]);

  return (
    <div>
      <Label className="mb-2 block">Priority <span className="text-red-500">*</span></Label>
      <RadioGroup 
        defaultValue={defaultValue} 
        className="flex space-x-4"
        onValueChange={handlePriorityChange}
        {...rest}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Low" id="low" />
          <Label htmlFor="low" className="font-normal">Low</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Medium" id="medium" />
          <Label htmlFor="medium" className="font-normal">Medium</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="High" id="high" />
          <Label htmlFor="high" className="font-normal">High</Label>
        </div>
      </RadioGroup>
      {errors.priority && (
        <span className="text-xs text-red-500">{errors.priority.message}</span>
      )}
    </div>
  );
};
