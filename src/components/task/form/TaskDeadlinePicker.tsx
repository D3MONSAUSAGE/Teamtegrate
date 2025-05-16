
import React from 'react';
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
  return (
    <div className="space-y-2">
      <Label>Deadline <span className="text-red-500">*</span></Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full sm:w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          <Input
            type="time"
            value={timeInput}
            onChange={onTimeChange}
            className="w-[120px]"
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
