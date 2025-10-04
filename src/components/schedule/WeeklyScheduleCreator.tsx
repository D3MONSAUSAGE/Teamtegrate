import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  Copy,
  AlertTriangle,
  CheckCircle,
  Save,
  Sparkles,
  Zap
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { toast } from 'sonner';
import { ModernTableCard } from './modern/ModernTableCard';
import { ModernActionCard } from './modern/ModernActionCard';

interface ShiftData {
  startTime: string;
  endTime: string;
  employeeId: string;
  notes?: string;
}

interface WeeklyScheduleData {
  [date: string]: {
    [employeeId: string]: ShiftData | null;
  };
}

interface WeeklyScheduleCreatorProps {
  selectedTeamId: string | null;
}

export const WeeklyScheduleCreator: React.FC<WeeklyScheduleCreatorProps> = ({ selectedTeamId }) => {
  const { user } = useAuth();
  const { createEmployeeSchedule, isLoading } = useScheduleManagement();
  const { teamMembers, isLoading: membersLoading } = useRealTeamMembers(selectedTeamId || '');
  
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Calculate week dates - memoized to prevent unnecessary recalculations
  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);
  
  // Initialize schedule data when week or team changes
  useEffect(() => {
    // Only initialize if we have team members and they've changed
    if (teamMembers.length === 0) return;
    
    const initialData: WeeklyScheduleData = {};
    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      initialData[dateKey] = {};
      teamMembers.forEach(member => {
        initialData[dateKey][member.id] = null;
      });
    });
    
    // Only update if the structure actually changed
    setScheduleData(prev => {
      const hasChanged = Object.keys(prev).length !== weekDays.length || 
                        teamMembers.some(member => !prev[Object.keys(prev)[0]]?.[member.id] === undefined);
      return hasChanged ? initialData : prev;
    });
  }, [selectedWeek, teamMembers.length, weekDays]);

  // Calculate total hours for each employee
  const employeeHours = useMemo(() => {
    const hours: { [employeeId: string]: number } = {};
    
    teamMembers.forEach(member => {
      let totalMinutes = 0;
      weekDays.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const shift = scheduleData[dateKey]?.[member.id];
        if (shift?.startTime && shift?.endTime) {
          const start = new Date(`2000-01-01T${shift.startTime}`);
          const end = new Date(`2000-01-01T${shift.endTime}`);
          if (end > start) {
            totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
          }
        }
      });
      hours[member.id] = totalMinutes / 60;
    });
    
    return hours;
  }, [scheduleData, teamMembers, weekDays]);

  // Calculate team totals
  const teamTotals = useMemo(() => {
    const totalHours = Object.values(employeeHours).reduce((sum, hours) => sum + hours, 0);
    const overtimeEmployees = Object.entries(employeeHours).filter(([_, hours]) => hours > 40).length;
    const scheduledEmployees = Object.entries(employeeHours).filter(([_, hours]) => hours > 0).length;
    
    return {
      totalHours: Math.round(totalHours * 100) / 100,
      overtimeEmployees,
      scheduledEmployees,
      averageHours: scheduledEmployees > 0 ? Math.round((totalHours / scheduledEmployees) * 100) / 100 : 0
    };
  }, [employeeHours]);

  const updateShift = (dateKey: string, employeeId: string, field: keyof ShiftData, value: string) => {
    setScheduleData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [employeeId]: {
          ...prev[dateKey]?.[employeeId],
          [field]: value,
          employeeId
        } as ShiftData
      }
    }));
  };

  const copyPreviousWeekSchedule = () => {
    // This would fetch the previous week's schedule and copy it
    toast.info('Copy from previous week feature coming soon');
  };

  const applyShiftTemplate = (startTime: string, endTime: string) => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees first');
      return;
    }

    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      selectedEmployees.forEach(employeeId => {
        updateShift(dateKey, employeeId, 'startTime', startTime);
        updateShift(dateKey, employeeId, 'endTime', endTime);
      });
    });
    
    toast.success(`Applied ${startTime}-${endTime} shift to ${selectedEmployees.length} employees`);
  };

  const saveWeeklySchedule = async () => {
    if (!selectedTeamId || !user) {
      toast.error('Please select a team');
      return;
    }

    try {
      const schedules = [];

      // Collect all non-empty shifts
      for (const [dateKey, daySchedule] of Object.entries(scheduleData)) {
        for (const [employeeId, shift] of Object.entries(daySchedule)) {
          if (shift?.startTime && shift?.endTime) {
            schedules.push({
              employee_id: employeeId,
              team_id: selectedTeamId,
              scheduled_date: dateKey,
              scheduled_start_time: shift.startTime,
              scheduled_end_time: shift.endTime,
              status: 'scheduled',
              notes: shift.notes || null,
              organization_id: user.organizationId,
              created_by: user.id
            });
          }
        }
      }

      if (schedules.length === 0) {
        toast.error('No shifts to save');
        return;
      }

      // Create schedules one by one (could be optimized with bulk insert)
      for (const schedule of schedules) {
        await createEmployeeSchedule(schedule);
      }

      toast.success(`Successfully created ${schedules.length} shifts for the week`);
      
      // Clear the form
      setScheduleData({});
      setSelectedEmployees([]);
      
    } catch (error) {
      console.error('Error saving weekly schedule:', error);
      toast.error('Failed to save weekly schedule');
    }
  };

  if (!selectedTeamId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Team</h3>
          <p className="text-muted-foreground">
            Choose a team from the dropdown above to start creating weekly schedules.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (membersLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header Card with Gradient */}
      <Card className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-inner">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                  Create Weekly Schedule
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {selectedTeamId 
                    ? `Building schedule for ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                    : 'Select a team to create schedules'
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={copyPreviousWeekSchedule} className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-300">
                <Copy className="h-4 w-4 mr-2" />
                Copy Previous Week
              </Button>
              <Button onClick={saveWeeklySchedule} disabled={isLoading} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modern Team Summary Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Hours</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {teamTotals.totalHours}h
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 shadow-inner">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-success/5 to-success/10 border-success/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Scheduled</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent">
                  {teamTotals.scheduledEmployees}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/30 shadow-inner">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Avg Hours</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                  {teamTotals.averageHours}h
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/30 shadow-inner">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Overtime</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-warning to-warning/70 bg-clip-text text-transparent">
                  {teamTotals.overtimeEmployees}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-warning/20 to-warning/30 shadow-inner">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Quick Templates Section */}
      <ModernActionCard
        title="Quick Templates"
        description="Select employees below, then apply a template to all selected employees for the entire week"
        icon={Sparkles}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Button
            variant="outline"
            className="hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all duration-300"
            onClick={() => applyShiftTemplate('09:00', '17:00')}
          >
            <Clock className="h-4 w-4 mr-2" />
            9 AM - 5 PM
          </Button>
          <Button
            variant="outline"
            className="hover:bg-accent/10 hover:border-accent/30 hover:scale-105 transition-all duration-300"
            onClick={() => applyShiftTemplate('08:00', '16:00')}
          >
            <Clock className="h-4 w-4 mr-2" />
            8 AM - 4 PM
          </Button>
          <Button
            variant="outline"
            className="hover:bg-success/10 hover:border-success/30 hover:scale-105 transition-all duration-300"
            onClick={() => applyShiftTemplate('10:00', '18:00')}
          >
            <Clock className="h-4 w-4 mr-2" />
            10 AM - 6 PM
          </Button>
          <Button
            variant="outline"
            className="hover:bg-warning/10 hover:border-warning/30 hover:scale-105 transition-all duration-300"
            onClick={() => applyShiftTemplate('06:00', '14:00')}
          >
            <Clock className="h-4 w-4 mr-2" />
            6 AM - 2 PM
          </Button>
          <Button
            variant="outline"
            className="hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all duration-300"
            onClick={() => applyShiftTemplate('14:00', '22:00')}
          >
            <Clock className="h-4 w-4 mr-2" />
            2 PM - 10 PM
          </Button>
        </div>
      </ModernActionCard>

      {/* Weekly Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <div className="text-sm text-muted-foreground">
            Click on employee names to select them for bulk template application
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 min-w-[150px]">Employee</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} className="text-center p-2 min-w-[120px]">
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-xs text-muted-foreground">{format(day, 'M/d')}</div>
                    </th>
                  ))}
                  <th className="text-center p-2 min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(member => (
                  <tr key={member.id} className="border-t">
                    <td className="p-2">
                      <div 
                        className={`cursor-pointer p-2 rounded ${
                          selectedEmployees.includes(member.id) 
                            ? 'bg-primary/10 border border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedEmployees(prev => 
                            prev.includes(member.id)
                              ? prev.filter(id => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                      >
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const shift = scheduleData[dateKey]?.[member.id];
                      return (
                        <td key={day.toISOString()} className="p-1">
                          <div className="space-y-1">
                            <Input
                              type="time"
                              placeholder="Start"
                              value={shift?.startTime || ''}
                              onChange={(e) => updateShift(dateKey, member.id, 'startTime', e.target.value)}
                              className="text-xs h-8"
                            />
                            <Input
                              type="time"
                              placeholder="End"
                              value={shift?.endTime || ''}
                              onChange={(e) => updateShift(dateKey, member.id, 'endTime', e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <div className="font-semibold">
                        {employeeHours[member.id]?.toFixed(1) || '0'}h
                      </div>
                      {employeeHours[member.id] > 40 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          OT
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Selected Employees Summary */}
      {selectedEmployees.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{selectedEmployees.length} employees selected</span>
                <span className="text-muted-foreground ml-2">
                  ({teamMembers.filter(m => selectedEmployees.includes(m.id)).map(m => m.name).join(', ')})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmployees([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};