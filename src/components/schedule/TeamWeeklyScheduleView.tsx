import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeekPicker } from '@/components/ui/week-picker';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Download, 
  Search,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CalendarDays,
  Edit,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';
import { useTeamWeeklySchedules } from '@/hooks/useTeamWeeklySchedules';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ModernTableCard } from './modern/ModernTableCard';
import { ScheduleEditModal } from './ScheduleEditModal';

interface TeamWeeklyScheduleViewProps {
  selectedTeamId: string | null;
}

export const TeamWeeklyScheduleView: React.FC<TeamWeeklyScheduleViewProps> = ({
  selectedTeamId
}) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const { 
    teamSchedules, 
    teamMetrics, 
    isLoading, 
    error,
    exportSchedule
  } = useTeamWeeklySchedules(
    selectedTeamId,
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  // Filter team members by search query
  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return teamSchedules;
    
    return teamSchedules.filter(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamSchedules, searchQuery]);

  // Generate week days for header
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  const handleExport = async () => {
    try {
      await exportSchedule();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleEditSchedule = (shift: any) => {
    setEditingSchedule(shift);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Trigger refresh of schedules
    setSelectedWeek(new Date(selectedWeek));
  };

  const getShiftDisplay = (shift: any) => {
    const startTime = format(new Date(shift.scheduled_start_time), 'HH:mm');
    const endTime = format(new Date(shift.scheduled_end_time), 'HH:mm');
    const duration = shift.duration_hours || 0;
    
    return {
      timeRange: `${startTime}-${endTime}`,
      duration: `${duration}h`,
      status: shift.status
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200';
      case 'missed': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200';
      case 'scheduled': return 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200';
    }
  };

  if (!selectedTeamId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">Select a Team</p>
          <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
            Choose a team from the dropdown above to view their weekly schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <WeekPicker
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Modern Team Metrics Summary with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Projected Hours</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {teamMetrics?.projectedHours || 0}h
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actual: {teamMetrics?.actualHours || 0}h
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 shadow-inner">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Active Members</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                  {teamMetrics?.activeMembers || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/30 shadow-inner">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
          teamMetrics && teamMetrics.hoursVariance < 0 
            ? "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20"
            : "bg-gradient-to-br from-success/5 to-success/10 border-success/20"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Hours Variance</p>
                <p className={cn(
                  "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  teamMetrics && teamMetrics.hoursVariance < 0
                    ? "from-destructive to-destructive/70"
                    : "from-success to-success/70"
                )}>
                  {teamMetrics?.hoursVariance ? 
                    `${teamMetrics.hoursVariance > 0 ? '+' : ''}${Math.round(teamMetrics.hoursVariance)}h` 
                    : '0h'
                  }
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-xl shadow-inner",
                teamMetrics && teamMetrics.hoursVariance < 0
                  ? "bg-gradient-to-br from-destructive/20 to-destructive/30"
                  : "bg-gradient-to-br from-success/20 to-success/30"
              )}>
                {teamMetrics && teamMetrics.hoursVariance < 0 ? (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-success" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Utilization Rate</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {teamMetrics?.utilizationRate || 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 shadow-inner">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Schedule Grid */}
      <ModernTableCard
        title="Team Weekly Schedule"
        icon={CalendarDays}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium text-destructive mb-2">Failed to load schedule</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No Schedules Found</p>
              <p className="text-sm text-muted-foreground">
                No team members have schedules for the selected week.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-muted-foreground sticky left-0 bg-background z-10 min-w-[200px]">
                      Team Member
                    </th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="text-center p-4 font-medium text-muted-foreground min-w-[150px]">
                        <div className="flex flex-col">
                          <span className="text-sm">{format(day, 'EEE')}</span>
                          <span className="text-xs text-muted-foreground/70">{format(day, 'MMM d')}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-4 font-medium text-muted-foreground min-w-[120px]">
                      Total Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 sticky left-0 bg-background z-10">
                        <div className="flex flex-col">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-sm text-muted-foreground">{member.email}</span>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const daySchedules = member.schedules.filter(schedule => 
                          isSameDay(new Date(schedule.scheduled_date), day)
                        );
                        
                        return (
                          <td key={day.toISOString()} className="p-2 text-center">
                            {daySchedules.length === 0 ? (
                              <div className="text-muted-foreground text-xs">-</div>
                            ) : (
                              <div className="space-y-2">
                                {daySchedules.map((shift, index) => {
                                  const display = getShiftDisplay(shift);
                                  return (
                                    <div key={index} className="text-xs group relative">
                                      <div className="flex items-center justify-center gap-1">
                                        <Badge 
                                          variant="outline" 
                                          className={cn("text-xs cursor-pointer hover:opacity-80", getStatusColor(shift.status))}
                                          onClick={() => handleEditSchedule(shift)}
                                        >
                                          {display.timeRange}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleEditSchedule(shift)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="text-muted-foreground mt-1">
                                        {display.duration}
                                      </div>
                                      {shift?.area && (
                                        <div className="text-muted-foreground/70 text-xs mt-0.5">
                                          {shift.area}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-lg">{member.totalHours}h</span>
                          {member.overtimeHours > 0 && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              +{member.overtimeHours}h OT
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/20 font-semibold border-t-2">
                    <td className="p-4 sticky left-0 bg-muted/20 z-10">
                      <div className="text-sm text-muted-foreground">Projected Hours</div>
                    </td>
                    {weekDays.map((day) => {
                      const dayTotal = filteredSchedules.reduce((total, member) => {
                        const daySchedules = member.schedules.filter(schedule => 
                          isSameDay(new Date(schedule.scheduled_date), day)
                        );
                        return total + daySchedules.reduce((sum, shift) => sum + (shift.duration_hours || 0), 0);
                      }, 0);
                      
                      return (
                        <td key={day.toISOString()} className="p-4 text-center">
                          <span className="font-semibold text-primary">{dayTotal}h</span>
                        </td>
                      );
                    })}
                    <td className="p-4 text-center">
                      <span className="font-semibold text-lg text-primary">{teamMetrics?.projectedHours || 0}h</span>
                    </td>
                  </tr>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="p-4 sticky left-0 bg-muted/30 z-10">
                      <div className="text-sm text-muted-foreground">Actual Hours</div>
                    </td>
                    {weekDays.map((day) => {
                      // Calculate actual hours for this day from time entries
                      const dayActual = filteredSchedules.reduce((total, member) => {
                        return total + (member.actualHours || 0) / 7; // Approximate daily split
                      }, 0);
                      
                      return (
                        <td key={day.toISOString()} className="p-4 text-center">
                          <span className="font-semibold text-accent">-</span>
                        </td>
                      );
                    })}
                    <td className="p-4 text-center">
                      <span className="font-semibold text-lg text-accent">{teamMetrics?.actualHours || 0}h</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
      </ModernTableCard>

      {/* Edit Modal */}
      <ScheduleEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        schedule={editingSchedule}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};