
import React from 'react';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isValid, parseISO, set } from "date-fns";

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
    
    try {
      // If we're setting the date for the first time, also set a default time (noon)
      if (!date) {
        const newDate = new Date(selectedDate);
        newDate.setHours(12, 0, 0, 0);
        console.log('Setting initial date with default time (noon):', newDate.toISOString());
        onDateChange(newDate);
      } else {
        // Preserve the existing time when changing just the date
        const newDate = new Date(selectedDate);
        
        if (timeInput) {
          try {
            const [hours, minutes] = timeInput.split(':').map(Number);
            newDate.setHours(hours || 0, minutes || 0, 0, 0);
          } catch (e) {
            console.error('Error parsing time for date selection:', e);
            // Fallback to noon
            newDate.setHours(12, 0, 0, 0);
          }
        } else {
          // Default to noon if no time input
          newDate.setHours(12, 0, 0, 0);
        }
        
        console.log('Updated date with preserved time:', newDate.toISOString());
        onDateChange(newDate);
      }
    } catch (err) {
      console.error("Error in handleInitialDateSelect:", err);
      // Fallback to a safe default
      const safeDate = new Date(selectedDate);
      safeDate.setHours(12, 0, 0, 0);
      onDateChange(safeDate);
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
                onChange={(e) => {
                  console.log('Time changed to:', e.target.value);
                  onTimeChange(e);
                  
                  // Also update the date with the new time
                  if (date && e.target.value) {
                    try {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newDate = new Date(date);
                      newDate.setHours(hours || 0, minutes || 0);
                      onDateChange(newDate);
                    } catch (err) {
                      console.error("Error updating date with new time:", err);
                    }
                  }
                }}
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
