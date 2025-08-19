import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ScheduleCalendarView: React.FC = () => {
  const { employeeSchedules, fetchEmployeeSchedules, isLoading } = useScheduleManagement();
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    const weekStart = format(startOfWeek(selectedWeek), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(selectedWeek), 'yyyy-MM-dd');
    fetchEmployeeSchedules(weekStart, weekEnd);
  }, [selectedWeek, fetchEmployeeSchedules]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(current => 
      direction === 'prev' 
        ? addDays(current, -7)
        : addDays(current, 7)
    );
  };

  const renderCalendarGrid = () => {
    const weekStart = startOfWeek(selectedWeek);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const timeSlots = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with days */}
          <div className="grid grid-cols-8 gap-px bg-border">
            <div className="bg-background p-3 text-sm font-medium">Time</div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="bg-background p-3 text-sm font-medium text-center"
              >
                <div>{format(day, 'EEE')}</div>
                <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="grid grid-cols-8 gap-px bg-border max-h-[600px] overflow-y-auto">
            {timeSlots.map((hour) => (
              <React.Fragment key={hour}>
                <div className="bg-background p-2 text-xs text-muted-foreground border-r">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
                {days.map((day) => {
                  const daySchedules = employeeSchedules.filter(schedule => {
                    const scheduleDate = new Date(schedule.scheduled_date);
                    const scheduleHour = new Date(schedule.scheduled_start_time).getHours();
                    return isSameDay(scheduleDate, day) && scheduleHour === hour;
                  });

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="bg-background p-1 min-h-[40px] border-r hover:bg-muted/50 cursor-pointer"
                    >
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="text-xs p-1 mb-1 rounded bg-primary/10 border border-primary/20"
                        >
                          <div className="font-medium truncate">
                            {schedule.employee?.name}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(schedule.scheduled_start_time), 'HH:mm')} -
                            {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {schedule.shift_template?.name}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Schedule Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(startOfWeek(selectedWeek), 'MMM d')} - {format(endOfWeek(selectedWeek), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Loading schedule...</div>
          </div>
        ) : (
          renderCalendarGrid()
        )}
      </CardContent>
    </Card>
  );
};