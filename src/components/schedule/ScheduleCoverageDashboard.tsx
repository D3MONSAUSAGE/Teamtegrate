import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WeekPicker } from '@/components/ui/week-picker';
import { ChevronLeft, ChevronRight, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useScheduleCoverageData } from '@/hooks/useScheduleCoverageData';
import { useTeamTimeStats } from '@/hooks/useTeamTimeStats';
import { useCoverageCalculations, HourCoverage } from '@/hooks/useCoverageCalculations';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ui/error-boundary';

interface ScheduleCoverageDashboardProps {
  selectedTeamId?: string | null;
}

const CoverageBar: React.FC<{ coverage: HourCoverage }> = ({ coverage }) => {
  const getBarColor = () => {
    switch (coverage.coverageLevel) {
      case 'none': return 'bg-gray-200';
      case 'low': return 'bg-destructive';
      case 'optimal': return 'bg-success';
      case 'high': return 'bg-warning';
      default: return 'bg-gray-200';
    }
  };

  const getBarHeight = () => {
    const maxEmployees = Math.max(coverage.scheduledEmployees.length, coverage.activeEmployees.length, 1);
    return `${Math.min(100, (maxEmployees / 5) * 100)}%`; // Scale to max 5 employees = 100%
  };

  return (
    <div className="relative h-16 w-full">
      <div 
        className={`absolute bottom-0 w-full rounded-t ${getBarColor()} transition-all duration-200`}
        style={{ height: getBarHeight() }}
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end h-full">
        <div className="flex -space-x-1">
          {coverage.activeEmployees.slice(0, 3).map((employee, index) => (
            <Avatar key={employee.id} className="h-6 w-6 border border-background">
              <AvatarImage src={employee.user?.avatar_url} />
              <AvatarFallback className="text-xs">
                {employee.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ))}
          {coverage.activeEmployees.length > 3 && (
            <div className="h-6 w-6 bg-muted border border-background rounded-full flex items-center justify-center text-xs">
              +{coverage.activeEmployees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DayColumn: React.FC<{ 
  day: ReturnType<typeof useCoverageCalculations>['days'][0];
  onHourClick: (hour: HourCoverage, dayName: string) => void;
}> = ({ day, onHourClick }) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-center p-3 border-b bg-muted/50">
        <div className="font-semibold text-sm">{day.dayName}</div>
        <div className="text-xs text-muted-foreground">{day.dateString}</div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-success">{day.dailyProjected}h</span>
          <span className="text-primary">{day.dailyActual}h</span>
        </div>
      </div>
      
      <div className="space-y-px bg-border">
        {day.hours.map((hour) => (
          <div
            key={hour.hour}
            className="bg-background hover:bg-muted/50 cursor-pointer transition-colors p-1"
            onClick={() => onHourClick(hour, day.dayName)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {format(new Date().setHours(hour.hour, 0, 0, 0), 'HH:mm')}
              </span>
              <Badge 
                variant={hour.coverageLevel === 'optimal' ? 'default' : 
                        hour.coverageLevel === 'high' ? 'secondary' :
                        hour.coverageLevel === 'low' ? 'destructive' : 'outline'}
                className="text-xs px-1 py-0"
              >
                {hour.actualHours}/{hour.projectedHours}
              </Badge>
            </div>
            <CoverageBar coverage={hour} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ScheduleCoverageDashboard: React.FC<ScheduleCoverageDashboardProps> = ({ 
  selectedTeamId 
}) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState<{ hour: HourCoverage; day: string } | null>(null);
  
  const { coverageData, isLoading, error, fetchCoverageData } = useScheduleCoverageData();
  const { teamStats, isLoading: teamStatsLoading } = useTeamTimeStats(selectedWeek, selectedTeamId);
  const weekCoverage = useCoverageCalculations(coverageData, selectedWeek);

  // Calculate summary metrics from team stats
  const summaryMetrics = React.useMemo(() => {
    if (!teamStats || teamStats.length === 0) {
      return {
        totalShifts: 0,
        totalHours: 0,
        activeTeams: 0,
        coverageRate: 0
      };
    }

    const totalShifts = teamStats.reduce((sum, stat) => sum + (stat.scheduledHours || 0), 0);
    const totalHours = Math.round(teamStats.reduce((sum, stat) => sum + (stat.totalHours || 0), 0));
    const activeTeams = teamStats.filter(stat => stat.activeMembers > 0).length;
    const coverageRate = totalShifts > 0 ? Math.round((totalHours / (totalShifts * 8)) * 100) : 0;

    return {
      totalShifts,
      totalHours,
      activeTeams,
      coverageRate
    };
  }, [teamStats]);

  useEffect(() => {
    fetchCoverageData(selectedWeek, selectedTeamId || undefined);
  }, [selectedWeek, selectedTeamId, fetchCoverageData]);

  const handleHourClick = (hour: HourCoverage, dayName: string) => {
    setSelectedHour({ hour, day: dayName });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <div className="text-destructive">Error loading coverage data: {error}</div>
            <Button 
              variant="outline" 
              onClick={() => fetchCoverageData(selectedWeek, selectedTeamId || undefined)}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || teamStatsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Summary Cards - Using Real Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week Shifts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summaryMetrics.totalShifts}</div>
              <p className="text-xs text-muted-foreground">Completed shifts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{summaryMetrics.activeTeams}</div>
              <p className="text-xs text-muted-foreground">Teams with activity</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{summaryMetrics.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Worked this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                summaryMetrics.coverageRate >= 80 ? 'text-success' : 
                summaryMetrics.coverageRate >= 60 ? 'text-warning' : 'text-destructive'
              }`}>
                {summaryMetrics.coverageRate}%
              </div>
              <p className="text-xs text-muted-foreground">Efficiency rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Coverage Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Schedule Coverage Overview</CardTitle>
              <WeekPicker
                selectedWeek={selectedWeek}
                onWeekChange={setSelectedWeek}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || teamStatsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      {Array.from({ length: 8 }).map((_, j) => (
                        <Skeleton key={j} className="h-12 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mb-4 p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded" />
                    <span className="text-xs">No Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded" />
                    <span className="text-xs">Low Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded" />
                    <span className="text-xs">Optimal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-warning rounded" />
                    <span className="text-xs">High Coverage</span>
                  </div>
                </div>

                {/* Weekly Grid */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {weekCoverage.days.map((day, index) => (
                    <DayColumn 
                      key={index} 
                      day={day} 
                      onHourClick={handleHourClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hour Details Modal/Panel - could be expanded later */}
        {selectedHour && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedHour.day} at {format(new Date().setHours(selectedHour.hour.hour, 0, 0, 0), 'HH:mm')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Scheduled Employees ({selectedHour.hour.scheduledEmployees.length})</h4>
                  <div className="space-y-1">
                    {selectedHour.hour.scheduledEmployees.map((schedule) => (
                      <div key={schedule.id} className="text-sm p-2 bg-muted/50 rounded">
                        {schedule.employee?.name || 'Unknown Employee'}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Active Employees ({selectedHour.hour.activeEmployees.length})</h4>
                  <div className="space-y-1">
                    {selectedHour.hour.activeEmployees.map((entry) => (
                      <div key={entry.id} className="text-sm p-2 bg-primary/10 rounded">
                        {entry.user?.name || 'Unknown User'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedHour(null)}
                className="mt-4"
              >
                Close Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ScheduleCoverageDashboard;