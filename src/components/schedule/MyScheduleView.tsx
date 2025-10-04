import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Timer, 
  ChevronLeft, 
  ChevronRight,
  QrCode,
  CalendarClock,
  FileText,
  Repeat
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleManagement, EmployeeSchedule } from '@/hooks/useScheduleManagement';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { format, startOfWeek, endOfWeek, addDays, isToday, differenceInHours, addWeeks, startOfDay, endOfDay } from 'date-fns';
import ModernMetricCard from './modern/ModernMetricCard';
import { EmployeeTimeStatusBadge } from '@/components/employee/EmployeeTimeStatusBadge';
import { WeeklyTimeEntriesCard } from './WeeklyTimeEntriesCard';
import { TimeEntryCorrectionManager } from './TimeEntryCorrectionManager';
import { EmployeeQRGenerator } from '@/components/attendance/EmployeeQRGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileScheduleDay } from './MobileScheduleDay';

export const MyScheduleView: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { employeeSchedules, fetchEmployeeSchedules, isLoading } = useScheduleManagement();
  const { 
    weeklyEntries, 
    currentSession, 
    clockIn, 
    clockOut, 
    startBreak, 
    endBreak,
    fetchWeeklyEntries,
    isLoading: timeTrackingLoading
  } = useEmployeeTimeTracking();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrTokenType, setQrTokenType] = useState<'clock_in' | 'clock_out'>('clock_in');

  useEffect(() => {
    if (user) {
      // Use Monday as the start of the week for schedules
      const weekStart = format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      fetchEmployeeSchedules(weekStart, weekEnd);
      // Fetch time entries for the current week (not selectedWeek)
      fetchWeeklyEntries(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  }, [user, selectedWeek, fetchEmployeeSchedules, fetchWeeklyEntries]);

  const mySchedules = employeeSchedules.filter(schedule => schedule.employee_id === user?.id);
  
  // Get next week's schedules (Monday to Sunday)
  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1));
  const nextWeekEnd = endOfWeek(nextWeekStart);
  const upcomingShifts = mySchedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduled_date);
    return scheduleDate >= startOfDay(nextWeekStart) && 
           scheduleDate <= endOfDay(nextWeekEnd) && 
           schedule.status === 'scheduled';
  });
  
  const completedShifts = mySchedules.filter(schedule => schedule.status === 'completed');
  const totalScheduledHours = mySchedules.reduce((total, schedule) => {
    const start = new Date(schedule.scheduled_start_time);
    const end = new Date(schedule.scheduled_end_time);
    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const getStatusBadge = (status: EmployeeSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">Completed</Badge>;
      case 'missed':
        return <Badge variant="destructive">Missed</Badge>;
      case 'excused':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">Excused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: EmployeeSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20';
      case 'completed':
        return 'border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20';
      case 'missed':
        return 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20';
      case 'excused':
        return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/20';
      default:
        return 'border-l-gray-500 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-950/20';
    }
  };

  const renderWeeklySchedule = () => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Mobile: show only today's schedule
    if (isMobile) {
      const today = new Date();
      const currentDay = days.find(day => isToday(day)) || today;
      const daySchedules = mySchedules.filter(schedule =>
        format(new Date(schedule.scheduled_date), 'yyyy-MM-dd') === format(currentDay, 'yyyy-MM-dd')
      );
      
      return (
        <MobileScheduleDay
          day={currentDay}
          schedules={daySchedules}
          getStatusBadge={getStatusBadge}
          getStatusColor={getStatusColor}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
        {days.map((day) => {
          const daySchedules = mySchedules.filter(schedule =>
            format(new Date(schedule.scheduled_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
          
          const isDayToday = isToday(day);

          return (
            <Card 
              key={day.toISOString()} 
              className={`min-h-[220px] transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${
                isDayToday 
                  ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md' 
                  : 'hover:shadow-elegant'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-semibold ${isDayToday ? 'text-primary' : ''}`}>
                    {format(day, 'EEE')}
                  </CardTitle>
                  {isDayToday && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
                <CardDescription className={`text-xs font-medium ${isDayToday ? 'text-primary/70' : ''}`}>
                  {format(day, 'MMM d')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`group relative p-3 rounded-xl border-l-4 transition-all duration-200 hover:shadow-sm hover:scale-[1.02] cursor-pointer ${getStatusColor(schedule.status)}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-foreground/90">
                          Work Shift
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="w-3 h-3" />
                          {Math.round(differenceInHours(new Date(schedule.scheduled_end_time), new Date(schedule.scheduled_start_time)))}h
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(schedule.scheduled_start_time), 'HH:mm')} - 
                        {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
                      </div>
                      
                      {schedule.area && (
                        <Badge variant="secondary" className="text-xs">
                          {schedule.area}
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {getStatusBadge(schedule.status)}
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                  </div>
                ))}
                
                {daySchedules.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                    <div className="text-xs text-muted-foreground/70 font-medium">
                      No shifts
                    </div>
                    <div className="text-xs text-muted-foreground/50 mt-1">
                      scheduled
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const handleOpenQRDialog = (type: 'clock_in' | 'clock_out') => {
    setQrTokenType(type);
    setQrDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent"
          onClick={() => handleOpenQRDialog(currentSession.isActive ? 'clock_out' : 'clock_in')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">QR Clock {currentSession.isActive ? 'Out' : 'In'}</h3>
                <p className="text-xs text-muted-foreground">Generate code to scan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent"
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
                <CalendarClock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Time Off Request</h3>
                <p className="text-xs text-muted-foreground">Request leave or PTO</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-success bg-gradient-to-br from-success/5 to-transparent"
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-accent/20">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">View Time Entries</h3>
                <p className="text-xs text-muted-foreground">Check your hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-warning bg-gradient-to-br from-warning/5 to-transparent"
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-warning/20 to-accent/20">
                <Repeat className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Swap Shift</h3>
                <p className="text-xs text-muted-foreground">Trade with teammate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Generator Dialog */}
      <EmployeeQRGenerator 
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        tokenType={qrTokenType}
      />

      {/* Metrics */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
        <ModernMetricCard
          title="Upcoming Shifts"
          value={upcomingShifts.length}
          change={{ value: '+2', trend: 'up' }}
          icon={Calendar}
          progress={75}
          description="This week"
          gradient="from-primary/10 to-primary/5"
        />
        
        <ModernMetricCard
          title="Hours Scheduled"
          value={`${Math.round(totalScheduledHours)}h`}
          change={{ value: '+4h', trend: 'up' }}
          icon={Clock}
          progress={85}
          description="This week"
          gradient="from-accent/10 to-accent/5"
        />
        
        <ModernMetricCard
          title="Completed"
          value={completedShifts.length}
          change={{ value: '+1', trend: 'up' }}
          icon={CheckCircle}
          progress={90}
          description="Shifts this week"
          gradient="from-success/10 to-success/5"
        />
        
        <ModernMetricCard
          title="Requests"
          value={0}
          change={{ value: '0', trend: 'neutral' }}
          icon={AlertCircle}
          progress={0}
          description="Pending requests"
          gradient="from-warning/10 to-warning/5"
        />
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {isMobile ? 'Today\'s Schedule' : 'Weekly Schedule'}
              </CardTitle>
              <CardDescription>
                {isMobile ? 'Your shift for today' : 'Your scheduled shifts for the selected week'}
              </CardDescription>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm font-medium px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
                  {format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderWeeklySchedule()}
        </CardContent>
      </Card>

      {/* Weekly Time Entries - Current Week */}
      <WeeklyTimeEntriesCard
        entries={weeklyEntries}
        weekStart={startOfWeek(new Date(), { weekStartsOn: 1 })}
        weekEnd={endOfWeek(new Date(), { weekStartsOn: 1 })}
      />

      {/* Time Entry Correction Requests */}
      <TimeEntryCorrectionManager />

      {/* Next Week's Shifts Detail */}
      {upcomingShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Next Week's Schedule
            </CardTitle>
            <CardDescription>
              Your shifts for {format(nextWeekStart, 'MMM d')} - {format(nextWeekEnd, 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingShifts.slice(0, 3).map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {format(new Date(schedule.scheduled_date), 'EEEE, MMM d')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(schedule.scheduled_start_time), 'HH:mm')} -{' '}
                      {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(schedule.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};