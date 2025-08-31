import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, MapPin, Calendar, Timer, AlertCircle } from 'lucide-react';
import { format, isToday, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmployeeSchedule } from '@/hooks/useScheduleManagement';

interface ModernScheduleGridProps {
  schedules: EmployeeSchedule[];
  onScheduleClick?: (schedule: EmployeeSchedule) => void;
  viewMode?: 'week' | 'day';
}

const ModernScheduleGrid: React.FC<ModernScheduleGridProps> = ({
  schedules,
  onScheduleClick,
  viewMode = 'week'
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gradient-to-r from-primary/10 to-primary/5 border-l-primary text-primary';
      case 'completed':
        return 'bg-gradient-to-r from-success/10 to-success/5 border-l-success text-success';
      case 'missed':
        return 'bg-gradient-to-r from-destructive/10 to-destructive/5 border-l-destructive text-destructive';
      case 'excused':
        return 'bg-gradient-to-r from-warning/10 to-warning/5 border-l-warning text-warning';
      default:
        return 'bg-gradient-to-r from-muted/10 to-muted/5 border-l-muted-foreground text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      scheduled: { label: 'Scheduled', variant: 'secondary' as const, className: 'bg-primary/10 text-primary border-primary/20' },
      completed: { label: 'Completed', variant: 'default' as const, className: 'bg-success/10 text-success border-success/20' },
      missed: { label: 'Missed', variant: 'destructive' as const, className: 'bg-destructive/10 text-destructive border-destructive/20' },
      excused: { label: 'Excused', variant: 'outline' as const, className: 'bg-warning/10 text-warning border-warning/20' }
    };

    const statusConfig = config[status as keyof typeof config] || { label: status, variant: 'secondary' as const, className: 'bg-muted/10 text-muted-foreground border-muted/20' };
    
    return (
      <Badge 
        variant={statusConfig.variant} 
        className={cn("text-xs font-medium", statusConfig.className)}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    const minutes = (end.getTime() - start.getTime()) % (1000 * 60 * 60) / (1000 * 60);
    return minutes > 0 ? `${hours}h ${Math.round(minutes)}m` : `${hours}h`;
  };

  if (schedules.length === 0) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/5 to-transparent" />
        <CardContent className="relative flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-gradient-to-r from-muted/20 to-muted/10 mb-4">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Schedules Found</h3>
          <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
            There are no scheduled shifts for the selected time period. Create new schedules to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {schedules.map((schedule) => {
        const scheduleDate = new Date(schedule.scheduled_date);
        const isScheduleToday = isToday(scheduleDate);
        
        return (
          <Card
            key={schedule.id}
            className={cn(
              "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer",
              "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
              "hover:scale-[1.02] hover:-translate-y-1",
              isScheduleToday && "ring-2 ring-primary/20 shadow-primary/10"
            )}
            onClick={() => onScheduleClick?.(schedule)}
          >
            {/* Background gradient based on status */}
            <div className={cn("absolute inset-0 opacity-30", getStatusColor(schedule.status).split(' ')[0])} />
            
            {/* Today indicator */}
            {isScheduleToday && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full animate-pulse" />
            )}
            
            <CardHeader className="relative pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 group-hover:scale-110 transition-transform">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {schedule.employee?.name || 'Unknown Employee'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {schedule.team?.name}
                    </p>
                  </div>
                </div>
                
                {getStatusBadge(schedule.status)}
              </div>
            </CardHeader>
            
            <CardContent className="relative space-y-4">
              {/* Date and Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={cn(
                    "font-medium",
                    isScheduleToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(scheduleDate, 'EEEE, MMM d')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {format(new Date(schedule.scheduled_start_time), 'HH:mm')} - 
                    {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {getShiftDuration(schedule.scheduled_start_time, schedule.scheduled_end_time)}
                  </span>
                </div>
              </div>
              
              {/* Notes if available */}
              {schedule.notes && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {schedule.notes}
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit action
                  }}
                >
                  Details
                </Button>
                
                {schedule.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle quick action
                    }}
                  >
                    Quick Edit
                  </Button>
                )}
              </div>
            </CardContent>
            
            {/* Left border for status */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", getStatusColor(schedule.status).split(' ')[1])} />
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </Card>
        );
      })}
    </div>
  );
};

export default ModernScheduleGrid;