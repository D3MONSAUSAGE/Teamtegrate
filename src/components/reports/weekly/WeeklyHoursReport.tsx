import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, Zap, Coffee, AlertCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DailyHoursData {
  day: string;
  minutes: number;
}

interface WeeklyHoursReportProps {
  hoursStats: DailyHoursData[] | null;
  isLoading: boolean;
}

export const WeeklyHoursReport: React.FC<WeeklyHoursReportProps> = ({ 
  hoursStats, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Hours Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 7 days for comparison
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  // Create chart data with proper day labels
  const chartData = last7Days.map(dateStr => {
    const statForDay = hoursStats?.find(stat => 
      format(new Date(stat.day), 'yyyy-MM-dd') === dateStr
    );
    
    const minutes = statForDay?.minutes || 0;
    const hours = Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal
    
    return {
      day: format(new Date(dateStr), 'EEE'),
      fullDate: dateStr,
      minutes,
      hours,
      overtime: Math.max(0, hours - 8), // Overtime after 8 hours
      regular: Math.min(hours, 8)
    };
  });

  // Calculate weekly summary
  const totalHours = chartData.reduce((sum, day) => sum + day.hours, 0);
  const totalOvertime = chartData.reduce((sum, day) => sum + day.overtime, 0);
  const averageDailyHours = Math.round((totalHours / 7) * 10) / 10;
  const workingDays = chartData.filter(day => day.hours > 0).length;

  // Find patterns
  const mostProductiveDay = chartData.reduce((best, day) => 
    day.hours > best.hours ? day : best, chartData[0]
  );
  const shortestDay = chartData.reduce((shortest, day) => 
    day.hours > 0 && day.hours < shortest.hours ? day : shortest, 
    chartData.find(d => d.hours > 0) || chartData[0]
  );

  // Overtime breakdown for pie chart
  const overtimeData = [
    { name: 'Regular Hours', value: Math.round((totalHours - totalOvertime) * 10) / 10, color: 'hsl(var(--primary))' },
    { name: 'Overtime Hours', value: Math.round(totalOvertime * 10) / 10, color: 'hsl(var(--destructive))' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{Math.round(totalHours * 10) / 10}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{averageDailyHours}h</p>
              </div>
              <Coffee className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Working Days</p>
                <p className="text-2xl font-bold">{workingDays}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overtime</p>
                <p className="text-2xl font-bold">{Math.round(totalOvertime * 10) / 10}h</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${totalOvertime > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Hours Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}h`, 
                        name === 'regular' ? 'Regular Hours' : 'Overtime Hours'
                      ]}
                      labelFormatter={(label) => {
                        const dayData = chartData.find(d => d.day === label);
                        return dayData ? `${label} (${format(new Date(dayData.fullDate), 'MMM dd')})` : label;
                      }}
                    />
                    <Bar dataKey="regular" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="overtime" stackId="a" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No hours data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hours Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {overtimeData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overtimeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}h`}
                    >
                      {overtimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}h`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No hours data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Most Productive Day</p>
                <p className="text-sm text-muted-foreground">
                  {mostProductiveDay?.day} - {mostProductiveDay?.hours}h
                </p>
              </div>
              <Badge variant="outline">Top Performer</Badge>
            </div>
            
            {shortestDay && shortestDay.hours > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Shortest Day</p>
                  <p className="text-sm text-muted-foreground">
                    {shortestDay.day} - {shortestDay.hours}h
                  </p>
                </div>
                <Badge variant="secondary">Light Day</Badge>
              </div>
            )}
          </div>

          {totalOvertime > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="font-medium text-destructive">Overtime Alert</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round(totalOvertime * 10) / 10} hours of overtime worked this week. 
                Consider reviewing workload distribution.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};