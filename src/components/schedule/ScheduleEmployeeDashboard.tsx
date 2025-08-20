import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle, CheckCircle, Users, MapPin, Timer } from 'lucide-react';
import { useScheduleManagement, EmployeeSchedule } from '@/hooks/useScheduleManagement';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, addDays, isToday, differenceInHours } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const ScheduleEmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { employeeSchedules, fetchEmployeeSchedules, isLoading } = useScheduleManagement();
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    if (user) {
      const weekStart = format(startOfWeek(selectedWeek), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedWeek), 'yyyy-MM-dd');
      fetchEmployeeSchedules(weekStart, weekEnd);
    }
  }, [user, selectedWeek, fetchEmployeeSchedules]);

  const mySchedules = employeeSchedules.filter(schedule => schedule.employee_id === user?.id);
  const upcomingShifts = mySchedules.filter(schedule => 
    new Date(schedule.scheduled_start_time) > new Date() && schedule.status === 'scheduled'
  );
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

  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    return `${hours}h`;
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
    const weekStart = startOfWeek(selectedWeek);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
                          {getShiftDuration(schedule.scheduled_start_time, schedule.scheduled_end_time)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(schedule.scheduled_start_time), 'HH:mm')} - 
                        {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {getStatusBadge(schedule.status)}
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">
            View your shifts, availability, and requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Request Time Off
          </Button>
          <Button variant="outline" size="sm">
            Swap Shift
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalScheduledHours)}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              Shifts this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Pending requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Views */}
      <Tabs defaultValue="week" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Shifts</TabsTrigger>
            <TabsTrigger value="availability">My Availability</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            >
              Previous Week
            </Button>
            <span className="text-sm font-medium">
              {format(startOfWeek(selectedWeek), 'MMM d')} - {format(endOfWeek(selectedWeek), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            >
              Next Week
            </Button>
          </div>
        </div>

        <TabsContent value="week" className="space-y-4">
          {renderWeeklySchedule()}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Shifts</CardTitle>
              <CardDescription>
                Your scheduled shifts for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingShifts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No upcoming shifts scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingShifts.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">
                          Scheduled Shift
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(schedule.scheduled_date), 'EEEE, MMM d')} •{' '}
                          {format(new Date(schedule.scheduled_start_time), 'HH:mm')} -{' '}
                          {format(new Date(schedule.scheduled_end_time), 'HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(schedule.status)}
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Availability</CardTitle>
              <CardDescription>
                Set your availability for scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-4">
                Availability management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleEmployeeDashboard;