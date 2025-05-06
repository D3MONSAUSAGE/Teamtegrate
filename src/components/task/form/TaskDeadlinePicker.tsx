
import React from 'react';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface TaskDeadlinePickerProps {
  date: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const TaskDeadlinePicker: React.FC<TaskDeadlinePickerProps> = ({
  date,
  timeInput,
  onDateChange,
  onTimeChange,
  error,
}) => {
  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="deadline">Deadline</Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="deadline"
              variant={"outline"}
              className="w-full justify-start text-left font-normal"
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "MMM dd, yyyy") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Input 
          type="time" 
          value={timeInput}
          onChange={onTimeChange}
          className="w-full sm:w-auto" 
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default TaskDeadlinePicker;
