
import React from 'react';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import TimeSelector from "@/components/ui/time-selector";
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from "date-fns";

interface MobileTaskDeadlineProps {
  deadlineDate: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const MobileTaskDeadline: React.FC<MobileTaskDeadlineProps> = ({
  deadlineDate,
  timeInput,
  onDateChange,
  onTimeChange
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left mobile-touch-target border-2 focus:border-primary"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {deadlineDate ? format(deadlineDate, "EEE, MMM d, yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deadlineDate}
              onSelect={onDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Due Time</Label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <TimeSelector
            value={timeInput}
            onChange={onTimeChange}
            placeholder="Select time"
            className="flex-1 mobile-touch-target border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileTaskDeadline;
