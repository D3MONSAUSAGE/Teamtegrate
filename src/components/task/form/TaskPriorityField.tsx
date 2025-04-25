
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskPriorityFieldProps {
  defaultValue?: string;
  setValue: (name: string, value: any) => void;
}

const TaskPriorityField: React.FC<TaskPriorityFieldProps> = ({
  defaultValue = "Medium",
  setValue
}) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="priority">Priority</Label>
      <Select 
        defaultValue={defaultValue} 
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
  );
};

export default TaskPriorityField;
