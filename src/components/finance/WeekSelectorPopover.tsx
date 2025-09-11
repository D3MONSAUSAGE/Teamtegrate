import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarWeekPicker } from '@/components/ui/calendar-week-picker';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, endOfWeek } from 'date-fns';

interface WeekSelectorPopoverProps {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
  className?: string;
}

export function WeekSelectorPopover({ selectedWeek, onWeekChange, className = "" }: WeekSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleWeekSelect = (week: Date) => {
    onWeekChange(week);
    setIsOpen(false);
  };

  const selectedWeekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-60 justify-start font-normal ${className}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">
            {format(selectedWeek, 'MMM dd')} - {format(selectedWeekEnd, 'MMM dd, yyyy')}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <CalendarWeekPicker
            selectedWeek={selectedWeek}
            onWeekChange={handleWeekSelect}
            className="compact-calendar"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}