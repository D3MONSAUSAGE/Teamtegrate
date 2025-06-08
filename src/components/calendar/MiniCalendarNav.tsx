
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

interface MiniCalendarNavProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  tasks: Task[];
  isCollapsed: boolean;
  onToggle: () => void;
}

const MiniCalendarNav: React.FC<MiniCalendarNavProps> = ({
  selectedDate,
  onDateSelect,
  tasks,
  isCollapsed,
  onToggle
}) => {
  // Get task count for a specific date
  const getTaskCount = (date: Date) => {
    return tasks.filter(task => {
      try {
        return isSameDay(new Date(task.deadline), date);
      } catch {
        return false;
      }
    }).length;
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="bg-background shadow-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 w-80">
      <Card className="shadow-lg bg-background/95 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Quick Navigation</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-6 w-6"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            className="w-full"
            modifiers={{
              hasTeasks: (date) => getTaskCount(date) > 0
            }}
            modifiersClassNames={{
              hasTeasks: "relative after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
            }}
            components={{
              Day: ({ date, ...props }) => {
                const taskCount = getTaskCount(date);
                return (
                  <div className="relative">
                    <button {...props}>
                      {format(date, 'd')}
                      {taskCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {taskCount > 9 ? '9+' : taskCount}
                        </div>
                      )}
                    </button>
                  </div>
                );
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MiniCalendarNav;
