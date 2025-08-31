import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  Timer,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  Download,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TimeScheduleReportsProps {
  memberId: string;
  teamId: string;
  timeRange: string;
}

export function TimeScheduleReports({ memberId, teamId, timeRange }: TimeScheduleReportsProps) {
  // Mock data - replace with actual API calls
  const timeMetrics = {
    totalHours: 38.5,
    expectedHours: 40,
    attendanceRate: 96,
    punctualityScore: 88,
    breakCompliance: 92,
    overtimeHours: 2.5,
    avgDailyHours: 7.7,
    workDays: 5
  };

  const weeklyHours = [
    { day: 'Mon', hours: 8.2, scheduled: 8 },
    { day: 'Tue', hours: 7.8, scheduled: 8 },
    { day: 'Wed', hours: 8.5, scheduled: 8 },
    { day: 'Thu', hours: 7.5, scheduled: 8 },
    { day: 'Fri', hours: 6.5, scheduled: 8 },
  ];

  const attendancePattern = [
    { week: 'Week 1', present: 5, absent: 0, late: 1 },
    { week: 'Week 2', present: 5, absent: 0, late: 0 },
    { week: 'Week 3', present: 4, absent: 1, late: 0 },
    { week: 'Week 4', present: 5, absent: 0, late: 2 },
  ];

  const timeEntries = [
    {
      date: '2024-01-30',
      clockIn: '08:45',
      clockOut: '17:30',
      breakTime: '60 min',
      totalHours: 7.75,
      status: 'complete',
      notes: ''
    },
    {
      date: '2024-01-29',
      clockIn: '09:15',
      clockOut: '18:00',
      breakTime: '45 min',
      totalHours: 8.0,
      status: 'late-start',
      notes: 'Traffic delay'
    },
    {
      date: '2024-01-28',
      clockIn: '08:30',
      clockOut: '17:00',
      breakTime: '60 min',
      totalHours: 8.0,
      status: 'complete',
      notes: ''
    },
    {
      date: '2024-01-27',
      clockIn: '08:00',
      clockOut: '16:30',
      breakTime: '30 min',
      totalHours: 8.0,
      status: 'short-break',
      notes: 'Skipped lunch break'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-success text-success-foreground';
      case 'late-start': return 'bg-warning text-warning-foreground';
      case 'short-break': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return CheckCircle2;
      case 'late-start': return AlertTriangle;
      case 'short-break': return Coffee;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Time & Schedule Management</h2>
          <p className="text-muted-foreground">
            Attendance, punctuality, and time tracking analysis
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Timesheet
        </Button>
      </div>

      {/* Time Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hours Worked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{timeMetrics.totalHours}h</div>
            <Progress value={(timeMetrics.totalHours / timeMetrics.expectedHours) * 100} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {timeMetrics.expectedHours}h expected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{timeMetrics.attendanceRate}%</div>
            <p className="text-sm text-success">Above target (95%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Punctuality Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{timeMetrics.punctualityScore}%</div>
            <Progress value={timeMetrics.punctualityScore} className="w-full" />
            <p className="text-sm text-warning">Room for improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              Break Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{timeMetrics.breakCompliance}%</div>
            <p className="text-sm text-success">Good compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Hours This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--primary))" name="Actual Hours" />
                <Bar dataKey="scheduled" fill="hsl(var(--muted))" name="Scheduled Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Attendance Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendancePattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" stackId="a" fill="hsl(var(--success))" name="Present" />
                <Bar dataKey="late" stackId="a" fill="hsl(var(--warning))" name="Late" />
                <Bar dataKey="absent" stackId="a" fill="hsl(var(--destructive))" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Tracking Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Adherence Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Core Hours Adherence</p>
                <p className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">94%</p>
                <p className="text-sm text-success">Excellent</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Break Schedule Compliance</p>
                <p className="text-sm text-muted-foreground">Lunch & rest breaks</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">92%</p>
                <p className="text-sm text-success">Good</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Overtime Frequency</p>
                <p className="text-sm text-muted-foreground">Hours beyond schedule</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{timeMetrics.overtimeHours}h</p>
                <p className="text-sm text-warning">Monitor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Pattern Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium">Consistent Schedule</p>
                  <p className="text-sm text-muted-foreground">
                    Maintains regular working hours most days
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">Occasional Late Starts</p>
                  <p className="text-sm text-muted-foreground">
                    2-3 late arrivals this month, mostly due to traffic
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Coffee className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Break Management</p>
                  <p className="text-sm text-muted-foreground">
                    Generally takes appropriate breaks, occasional rushed lunch
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeEntries.map((entry, index) => {
              const StatusIcon = getStatusIcon(entry.status);
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium">{entry.date}</span>
                    </div>
                    <Badge className={getStatusColor(entry.status)} variant="secondary">
                      {entry.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">In: </span>
                      <span className="font-medium">{entry.clockIn}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Out: </span>
                      <span className="font-medium">{entry.clockOut}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Break: </span>
                      <span className="font-medium">{entry.breakTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-bold">{entry.totalHours}h</span>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="text-sm text-muted-foreground italic">
                      {entry.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}