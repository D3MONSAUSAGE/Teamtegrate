
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskPriority } from '@/types';
import { UseFormReturn } from 'react-hook-form';

interface TaskPrioritySelectProps {
  form: UseFormReturn<any>;
}

const TaskPrioritySelect: React.FC<TaskPrioritySelectProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Priority</Label>
      <Select 
        defaultValue="Medium"
        onValueChange={(value) => form.setValue('priority', value as TaskPriority)}
      >
        <SelectTrigger className="h-12 border-2 focus:border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Low">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Low Priority
            </div>
          </SelectItem>
          <SelectItem value="Medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              Medium Priority
            </div>
          </SelectItem>
          <SelectItem value="High">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              High Priority
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskPrioritySelect;
