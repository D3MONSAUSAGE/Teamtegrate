
import React from 'react';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import TimeSelector from "@/components/ui/time-selector";
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns";

interface TaskDeadlineSectionProps {
  deadlineDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  timeInput: string;
  onTimeChange: (time: string) => void;
}

const TaskDeadlineSection: React.FC<TaskDeadlineSectionProps> = ({
  deadlineDate,
  onDateChange,
  timeInput,
  onTimeChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        Deadline <span className="text-red-500">*</span>
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-12 border-2 focus:border-primary"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border-2" align="start">
              <Calendar
                mode="single"
                selected={deadlineDate}
                onSelect={onDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <TimeSelector
            value={timeInput}
            onChange={onTimeChange}
            placeholder="Select time"
          />
        </div>
      </div>
    </div>
  );
};

export default TaskDeadlineSection;
