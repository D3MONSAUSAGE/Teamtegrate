
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimeSelector from "@/components/ui/time-selector";
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from "date-fns";

interface TaskDeadlineSectionProps {
  deadlineDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  timeInput: string;
  onTimeChange: (time: string) => void;
  warningPeriodHours?: number;
  onWarningPeriodChange?: (hours: number) => void;
}

const TaskDeadlineSection: React.FC<TaskDeadlineSectionProps> = ({
  deadlineDate,
  onDateChange,
  timeInput,
  onTimeChange,
  warningPeriodHours = 24,
  onWarningPeriodChange
}) => {
  const warningOptions = [
    { value: 1, label: '1 hour before' },
    { value: 4, label: '4 hours before' },
    { value: 12, label: '12 hours before' },
    { value: 24, label: '1 day before' },
    { value: 48, label: '2 days before' },
    { value: 168, label: '1 week before' },
  ];

  return (
    <div className="space-y-4">
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
      
      {/* Warning Period Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          Warning Period
        </Label>
        <Select 
          value={warningPeriodHours.toString()} 
          onValueChange={(value) => onWarningPeriodChange?.(parseInt(value))}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select when to show warning" />
          </SelectTrigger>
          <SelectContent>
            {warningOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Task will glow yellow and send a notification when this time period is reached before the deadline.
        </p>
      </div>
    </div>
  );
};

export default TaskDeadlineSection;
