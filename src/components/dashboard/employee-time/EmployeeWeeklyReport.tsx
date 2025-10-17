
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Clock, 
  Coffee, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { TimeEntry } from '@/contexts/TimeTrackingContext';
import { formatHoursMinutes, formatTime12Hour } from '@/utils/timeUtils';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';

interface EmployeeWeeklyReportProps {
  weeklyEntries: TimeEntry[];
}

const EmployeeWeeklyReport: React.FC<EmployeeWeeklyReportProps> = ({
  weeklyEntries
}) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayEntries = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weeklyEntries.filter(entry => {
      const entryDate = format(parseISO(entry.clock_in), 'yyyy-MM-dd');
      return entryDate === dateStr;
    }).sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());
  };

  const calculateDayTotals = (entries: TimeEntry[]) => {
    const workEntries = entries.filter(entry => 
      entry.clock_out && (!entry.notes || !entry.notes.toLowerCase().includes('break'))
    );
    const breakEntries = entries.filter(entry => 
      entry.clock_out && entry.notes?.toLowerCase().includes('break')
    );

    const workMinutes = workEntries.reduce((total, entry) => 
      total + (entry.duration_minutes || 0), 0
    );
    const breakMinutes = breakEntries.reduce((total, entry) => 
      total + (entry.duration_minutes || 0), 0
    );

    return { workMinutes, breakMinutes, workEntries: workEntries.length, breakEntries: breakEntries.length };
  };

  const weeklyTotals = weeklyEntries.reduce((totals, entry) => {
    if (entry.clock_out) {
      const isBreak = entry.notes?.toLowerCase().includes('break');
      if (isBreak) {
        totals.totalBreakMinutes += entry.duration_minutes || 0;
        totals.totalBreaks += 1;
      } else {
        totals.totalWorkMinutes += entry.duration_minutes || 0;
        totals.totalSessions += 1;
      }
    }
    return totals;
  }, { totalWorkMinutes: 0, totalBreakMinutes: 0, totalSessions: 0, totalBreaks: 0 });

  const standardWeeklyHours = 2400; // 40 hours
  const overtimeMinutes = Math.max(0, weeklyTotals.totalWorkMinutes - standardWeeklyHours);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Weekly Time Report
          <span className="ml-auto text-sm text-muted-foreground">
            Week of {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium">Total Work</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formatHoursMinutes(weeklyTotals.totalWorkMinutes)}
            </div>
            <div className="text-xs text-blue-500">
              {weeklyTotals.totalSessions} sessions
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium">Total Breaks</span>
            </div>
            <div className="text-lg font-bold text-orange-600">
              {formatHoursMinutes(weeklyTotals.totalBreakMinutes)}
            </div>
            <div className="text-xs text-orange-500">
              {weeklyTotals.totalBreaks} breaks
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${
            overtimeMinutes > 0 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`h-4 w-4 ${overtimeMinutes > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <span className="text-xs font-medium">Overtime</span>
            </div>
            <div className={`text-lg font-bold ${overtimeMinutes > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overtimeMinutes > 0 ? formatHoursMinutes(overtimeMinutes) : '0:00'}
            </div>
            <div className={`text-xs ${overtimeMinutes > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {overtimeMinutes > 0 ? 'Over 40h limit' : 'Within limits'}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium">Avg Daily</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {formatHoursMinutes(Math.round(weeklyTotals.totalWorkMinutes / 7))}
            </div>
            <div className="text-xs text-purple-500">
              Per day average
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium">Daily Breakdown</h4>
          
          {weekDays.map((day, index) => {
            const dayEntries = getDayEntries(day);
            const dayTotals = calculateDayTotals(dayEntries);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const hasLongDay = dayTotals.workMinutes > 480; // Over 8 hours

            return (
              <div
                key={index}
                className={`rounded-lg border p-3 ${
                  isToday 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {format(day, 'EEEE, MMM d')}
                    </span>
                    {isToday && (
                      <Badge variant="secondary" className="text-xs">Today</Badge>
                    )}
                    {hasLongDay && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Long Day
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatHoursMinutes(dayTotals.workMinutes)}
                    </div>
                    {dayTotals.breakMinutes > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{formatHoursMinutes(dayTotals.breakMinutes)} breaks
                      </div>
                    )}
                  </div>
                </div>

                {dayEntries.length > 0 && (
                  <div className="space-y-1">
                    {dayEntries.map((entry, entryIndex) => {
                      const isBreak = entry.notes?.toLowerCase().includes('break');
                      return (
                        <div
                          key={entryIndex}
                          className={`text-xs flex items-center justify-between p-2 rounded ${
                            isBreak 
                              ? 'bg-orange-100 dark:bg-orange-950/30' 
                              : 'bg-blue-100 dark:bg-blue-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isBreak ? (
                              <Coffee className="h-3 w-3 text-orange-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-blue-600" />
                            )}
                            <span>
                              {formatTime12Hour(entry.clock_in)} - {
                                entry.clock_out 
                                  ? formatTime12Hour(entry.clock_out)
                                  : 'ongoing'
                              }
                            </span>
                            {entry.notes && (
                              <span className="text-muted-foreground">
                                ({entry.notes})
                              </span>
                            )}
                          </div>
                          <span className="font-medium">
                            {entry.duration_minutes ? formatHoursMinutes(entry.duration_minutes) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dayEntries.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No time entries for this day
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeWeeklyReport;
