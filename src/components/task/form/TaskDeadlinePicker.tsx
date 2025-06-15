
import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  
  const formattedDate = date ? format(date, "PPP") : "Select date";

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(e);
  };

  const handleTimeClick = () => {
    // Force focus and show time picker on mobile/desktop
    if (timeInputRef.current) {
      timeInputRef.current.focus();
      timeInputRef.current.showPicker?.();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Deadline <span className="text-red-500">*</span></Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formattedDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange(selectedDate);
                setIsCalendarOpen(false);
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex items-center relative">
          <Clock className="absolute left-2 h-4 w-4 z-10 pointer-events-none text-muted-foreground" />
          <Input
            ref={timeInputRef}
            type="time"
            value={timeInput}
            onChange={handleTimeChange}
            onClick={handleTimeClick}
            className="w-full pl-8 cursor-pointer"
            placeholder="Select time"
            // Add these attributes for better mobile support
            step="60"
            autoComplete="off"
          />
        </div>
      </div>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
};

export default TaskDeadlinePicker;
