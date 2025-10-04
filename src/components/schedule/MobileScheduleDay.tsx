import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer, Calendar } from 'lucide-react';
import { format, differenceInHours, isToday } from 'date-fns';
import { EmployeeSchedule } from '@/hooks/useScheduleManagement';

interface MobileScheduleDayProps {
  day: Date;
  schedules: EmployeeSchedule[];
  getStatusBadge: (status: EmployeeSchedule['status']) => React.ReactNode;
  getStatusColor: (status: EmployeeSchedule['status']) => string;
}

export const MobileScheduleDay: React.FC<MobileScheduleDayProps> = ({
  day,
  schedules,
  getStatusBadge,
  getStatusColor,
}) => {
  const isDayToday = isToday(day);
  
  return (
    <Card 
      className={`min-h-[280px] transition-all duration-200 ${
        isDayToday 
          ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md' 
          : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base font-semibold ${isDayToday ? 'text-primary' : ''}`}>
            {format(day, 'EEEE')}
          </CardTitle>
          {isDayToday && (
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <CardDescription className={`text-sm font-medium ${isDayToday ? 'text-primary/70' : ''}`}>
          {format(day, 'MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`group relative p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-sm ${getStatusColor(schedule.status)}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-foreground">
                  Work Shift
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  {Math.round(differenceInHours(new Date(schedule.scheduled_end_time), new Date(schedule.scheduled_start_time)))}h
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {format(new Date(schedule.scheduled_start_time), 'HH:mm')} - 
                {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
              </div>
              
              <div className="flex items-center justify-between">
                {getStatusBadge(schedule.status)}
              </div>
            </div>
          </div>
        ))}
        
        {schedules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <div className="text-sm text-muted-foreground/70 font-medium">
              No shifts scheduled
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
