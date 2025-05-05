
import React from 'react';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isValid, parseISO } from "date-fns";

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
  error
}) => {
  // Format the display time in a more readable format
  const getDisplayTime = () => {
    if (!timeInput) return '12:00 PM';
    
    try {
      // Create a dummy date with the time to format it
      const dummyDate = new Date();
      const [hours, minutes] = timeInput.split(':').map(Number);
      dummyDate.setHours(hours || 0, minutes || 0);
      
      return isValid(dummyDate) 
        ? format(dummyDate, 'h:mm a')
        : '12:00 PM';
    } catch (error) {
      console.error('Error formatting time:', error);
      return '12:00 PM';
    }
  };

  // Handle initial selection if date is undefined
  const handleInitialDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    // If we're setting the date for the first time, also set a default time (noon)
    if (!date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(12, 0, 0, 0);
      onDateChange(newDate);
    } else {
      onDateChange(selectedDate);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="deadline">Deadline</Label>
      <div className="flex space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date && isValid(date) ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleInitialDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[120px] px-3 justify-between"
            >
              <Clock className="h-4 w-4 mr-1" />
              <span className="ml-1">{getDisplayTime()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={timeInput}
                onChange={onTimeChange}
                className="w-[120px]"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default TaskDeadlinePicker;
