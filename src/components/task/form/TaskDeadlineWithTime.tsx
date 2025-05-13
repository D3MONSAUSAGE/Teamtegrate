
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TaskDeadlineWithTimeProps {
  register: any;
  timeInput: string;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  watch: any;
}

const TaskDeadlineWithTime: React.FC<TaskDeadlineWithTimeProps> = ({
  register,
  timeInput,
  onTimeChange,
  watch
}) => {
  // Safely use watch if it's a function
  const watchDeadline = typeof watch === 'function' ? watch('deadline') : '';
  
  return (
    <div className="space-y-1">
      <Label htmlFor="deadline">Deadline</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          id="deadline"
          type="date"
          {...register("deadline")}
        />
        <Input
          id="deadlineTime"
          type="time"
          value={timeInput}
          onChange={onTimeChange}
        />
      </div>
    </div>
  );
};

export default TaskDeadlineWithTime;
