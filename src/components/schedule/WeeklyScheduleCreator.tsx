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
  AlertTriangle,
  CheckCircle,
  Save,
  Sparkles,
  Zap,
  Send
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
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
  area?: string;
  scheduleId?: string;
  isExisting?: boolean;
  isModified?: boolean;
}

interface WeeklyScheduleData {
  [date: string]: {
    [employeeId: string]: ShiftData | null;
  };
}

interface WeeklyScheduleCreatorProps {
  selectedTeamId: string | null;
}

const SCHEDULE_AREAS = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'dining', label: 'Dining Area' },
  { value: 'bar', label: 'Bar' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'back_office', label: 'Back Office' },
  { value: 'storage', label: 'Storage' },
  { value: 'drive_thru', label: 'Drive-Thru' },
  { value: 'prep', label: 'Prep Area' },
  { value: 'other', label: 'Other' },
] as const;

export const WeeklyScheduleCreator: React.FC<WeeklyScheduleCreatorProps> = ({ selectedTeamId }) => {
  const { user } = useAuth();
  const { createEmployeeSchedule, isLoading } = useScheduleManagement();
  const { teamMembers, isLoading: membersLoading } = useRealTeamMembers(selectedTeamId || '');
  
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Calculate week dates - memoized to prevent unnecessary recalculations
  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);
  
  // Fetch existing schedules for the selected week and team
  const fetchExistingSchedules = async () => {
    if (!selectedTeamId || teamMembers.length === 0) return;
    
    setIsLoadingExisting(true);
    try {
      const { data: existingSchedules, error } = await supabase
        .from('employee_schedules')
        .select('id, employee_id, scheduled_date, scheduled_start_time, scheduled_end_time, notes, area')
        .eq('team_id', selectedTeamId)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching existing schedules:', error);
        toast.error('Failed to load existing schedules');
        return;
      }

      if (existingSchedules && existingSchedules.length > 0) {
        const newScheduleData: WeeklyScheduleData = {};
        
        // Initialize empty structure
        weekDays.forEach(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          newScheduleData[dateKey] = {};
          teamMembers.forEach(member => {
            newScheduleData[dateKey][member.id] = null;
          });
        });
        
        // Fill in existing schedules
        existingSchedules.forEach((schedule) => {
          const dateKey = schedule.scheduled_date;
          const startTime = schedule.scheduled_start_time.substring(11, 16);
          const endTime = schedule.scheduled_end_time.substring(11, 16);
          
          if (newScheduleData[dateKey]) {
            newScheduleData[dateKey][schedule.employee_id] = {
              startTime,
              endTime,
              employeeId: schedule.employee_id,
              notes: schedule.notes || '',
              area: schedule.area || '',
              scheduleId: schedule.id,
              isExisting: true,
              isModified: false
            };
          }
        });
        
        setScheduleData(newScheduleData);
        toast.success(`Loaded ${existingSchedules.length} existing schedules`);
      } else {
        // Initialize empty structure if no existing schedules
        const initialData: WeeklyScheduleData = {};
        weekDays.forEach(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          initialData[dateKey] = {};
          teamMembers.forEach(member => {
            initialData[dateKey][member.id] = null;
          });
        });
        setScheduleData(initialData);
      }
    } catch (error) {
      console.error('Error fetching existing schedules:', error);
      toast.error('Failed to load existing schedules');
    } finally {
      setIsLoadingExisting(false);
    }
  };

  // Load existing schedules when team or week changes
  useEffect(() => {
    if (selectedTeamId && teamMembers.length > 0) {
      fetchExistingSchedules();
    }
  }, [selectedTeamId, selectedWeek, teamMembers.length]);

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
    setScheduleData(prev => {
      const existingShift = prev[dateKey]?.[employeeId];
      const isExisting = existingShift?.isExisting || false;
      
      return {
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [employeeId]: {
            ...existingShift,
            [field]: value,
            employeeId,
            isModified: isExisting // Mark as modified if it was existing
          } as ShiftData
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const sendWeeklySchedule = async () => {
    if (!selectedTeamId || !user) {
      toast.error('Please select a team');
      return;
    }

    try {
      // First save the schedule
      await saveWeeklySchedule();
      
      // Get all unique employees who have schedules this week
      const affectedEmployees = new Set<string>();
      Object.values(scheduleData).forEach(daySchedule => {
        Object.entries(daySchedule).forEach(([employeeId, shift]) => {
          if (shift?.startTime && shift?.endTime) {
            affectedEmployees.add(employeeId);
          }
        });
      });
      
      if (affectedEmployees.size === 0) {
        toast.error('No employees have been scheduled');
        return;
      }

      // Send notifications to each employee
      let notificationsSent = 0;
      let emailsSent = 0;

      for (const employeeId of affectedEmployees) {
        // Create in-app notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: employeeId,
          title: 'Your Schedule Has Been Updated',
          content: `Your schedule for the week of ${format(weekStart, 'MMM d')} has been published.`,
          type: 'schedule_update',
          organization_id: user.organizationId
        });

        if (!notifError) notificationsSent++;
        
        // Trigger email edge function
        const { error: emailError } = await supabase.functions.invoke('send-schedule-email', {
          body: { 
            user_id: employeeId,
            week_start: format(weekStart, 'yyyy-MM-dd'),
            week_end: format(weekEnd, 'yyyy-MM-dd')
          }
        });

        if (!emailError) emailsSent++;
      }
      
      toast.success(`Schedule sent to ${affectedEmployees.size} employees (${notificationsSent} notifications, ${emailsSent} emails)`);
    } catch (error) {
      console.error('Error sending schedule:', error);
      toast.error('Failed to send schedule');
    }
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

  // Validate individual shift
  const validateShift = (shift: ShiftData, dateKey: string, employeeName: string) => {
    const start = new Date(`2000-01-01T${shift.startTime}`);
    const end = new Date(`2000-01-01T${shift.endTime}`);
    
    if (end <= start) {
      return { 
        valid: false, 
        error: `${employeeName} on ${dateKey}: End time must be after start time` 
      };
    }
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours > 16) {
      return { 
        valid: false, 
        error: `${employeeName} on ${dateKey}: Shift cannot be longer than 16 hours` 
      };
    }
    
    return { valid: true };
  };

  // Check for duplicate schedules in database
  const checkForDuplicates = async (schedules: any[]) => {
    if (schedules.length === 0) return schedules;
    
    const { data: existing } = await supabase
      .from('employee_schedules')
      .select('employee_id, scheduled_date, scheduled_start_time')
      .in('employee_id', [...new Set(schedules.map(s => s.employee_id))])
      .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));
    
    if (!existing) return schedules;
    
    return schedules.filter(schedule => 
      !existing.some(ex => 
        ex.employee_id === schedule.employee_id &&
        ex.scheduled_date === schedule.scheduled_date &&
        ex.scheduled_start_time === schedule.scheduled_start_time
      )
    );
  };

  const saveWeeklySchedule = async () => {
    if (!selectedTeamId || !user) {
      toast.error('Please select a team');
      return;
    }

    try {
      const newSchedules = [];
      const existingSchedules = [];
      const validationErrors = [];

      // Step 1: Separate new schedules from existing ones
      for (const [dateKey, daySchedule] of Object.entries(scheduleData)) {
        for (const [employeeId, shift] of Object.entries(daySchedule)) {
          if (shift?.startTime && shift?.endTime) {
            const employee = teamMembers.find(m => m.id === employeeId);
            const employeeName = employee?.name || 'Unknown';
            
            const validation = validateShift(shift, dateKey, employeeName);
            if (!validation.valid) {
              validationErrors.push(validation.error);
              continue;
            }

            const scheduleEntry = {
              employee_id: employeeId,
              team_id: selectedTeamId,
              scheduled_date: dateKey,
              scheduled_start_time: `${dateKey}T${shift.startTime}:00`,
              scheduled_end_time: `${dateKey}T${shift.endTime}:00`,
              status: 'scheduled',
              notes: shift.notes || null,
              area: shift.area || null,
              organization_id: user.organizationId,
              created_by: user.id
            };

            if (shift.scheduleId && shift.isExisting) {
              existingSchedules.push({ ...scheduleEntry, id: shift.scheduleId });
            } else {
              newSchedules.push(scheduleEntry);
            }
          }
        }
      }

      if (validationErrors.length > 0) {
        toast.error(`Validation errors: ${validationErrors.join(', ')}`);
        return;
      }

      if (newSchedules.length === 0 && existingSchedules.length === 0) {
        toast.error('No shifts to save');
        return;
      }

      let insertSuccessCount = 0;
      let insertErrorCount = 0;
      let updateSuccessCount = 0;
      let updateErrorCount = 0;

      // Step 2: Handle new schedules (INSERT)
      if (newSchedules.length > 0) {
        const uniqueSchedules = await checkForDuplicates(newSchedules);
        const duplicateCount = newSchedules.length - uniqueSchedules.length;
        
        if (duplicateCount > 0) {
          toast.info(`${duplicateCount} duplicate(s) skipped`);
        }

        const batchSize = 20;
        for (let i = 0; i < uniqueSchedules.length; i += batchSize) {
          const batch = uniqueSchedules.slice(i, i + batchSize);
          
          const { data, error } = await supabase
            .from('employee_schedules')
            .insert(batch)
            .select();

          if (error) {
            console.error('Batch insert error:', error);
            insertErrorCount += batch.length;
          } else {
            insertSuccessCount += data?.length || 0;
          }
        }
      }

      // Step 3: Handle existing schedules (UPDATE)
      if (existingSchedules.length > 0) {
        for (const schedule of existingSchedules) {
          const { error } = await supabase
            .from('employee_schedules')
            .update({
              scheduled_start_time: schedule.scheduled_start_time,
              scheduled_end_time: schedule.scheduled_end_time,
              notes: schedule.notes,
              area: schedule.area
            })
            .eq('id', schedule.id);

          if (error) {
            console.error('Update error:', error);
            updateErrorCount++;
          } else {
            updateSuccessCount++;
          }
        }
      }

      // Step 4: Show results
      const messages = [];
      if (insertSuccessCount > 0) messages.push(`Created ${insertSuccessCount} new`);
      if (updateSuccessCount > 0) messages.push(`Updated ${updateSuccessCount} existing`);
      
      if (messages.length > 0) {
        toast.success(`Schedules saved: ${messages.join(', ')}`);
        setHasUnsavedChanges(false);
        await fetchExistingSchedules(); // Reload to show updated state
      }
      
      if (insertErrorCount > 0 || updateErrorCount > 0) {
        toast.error(`Failed: ${insertErrorCount} inserts, ${updateErrorCount} updates`);
      }
      
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
              <Button variant="outline" onClick={saveWeeklySchedule} disabled={isLoading || isLoadingExisting}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : isLoadingExisting ? 'Loading...' : 'Save Draft'}
              </Button>
              <Button onClick={sendWeeklySchedule} disabled={isLoading || isLoadingExisting} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg">
                <Send className="h-4 w-4 mr-2" />
                Send Schedule
              </Button>
            </div>
          </div>
          {hasUnsavedChanges && (
            <div className="mt-4 text-sm text-warning flex items-center gap-2 bg-warning/10 p-3 rounded-lg border border-warning/20">
              <AlertTriangle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
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
                      const isExisting = shift?.isExisting;
                      const isModified = shift?.isModified;
                      const hasData = shift?.startTime || shift?.endTime;
                      
                      return (
                        <td key={day.toISOString()} className="p-1">
                          <div className="space-y-1 relative">
                            {/* Status Badge */}
                            {isExisting && (
                              <div className="absolute -top-1 -right-1 z-10">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  isModified 
                                    ? 'bg-warning/20 text-warning border border-warning/40' 
                                    : 'bg-success/20 text-success border border-success/40'
                                }`}>
                                  {isModified ? '✎ Modified' : '✓ Saved'}
                                </span>
                              </div>
                            )}
                            {!isExisting && hasData && (
                              <div className="absolute -top-1 -right-1 z-10">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/20 text-primary border border-primary/40">
                                  ⊕ New
                                </span>
                              </div>
                            )}
                            
                            <Input
                              type="time"
                              placeholder="Start"
                              value={shift?.startTime || ''}
                              onChange={(e) => updateShift(dateKey, member.id, 'startTime', e.target.value)}
                              className={`text-xs h-8 ${isExisting ? 'border-success/50 bg-success/5' : ''}`}
                            />
                            <Input
                              type="time"
                              placeholder="End"
                              value={shift?.endTime || ''}
                              onChange={(e) => updateShift(dateKey, member.id, 'endTime', e.target.value)}
                              className={`text-xs h-8 ${isExisting ? 'border-success/50 bg-success/5' : ''}`}
                            />
                            <Select
                              value={shift?.area || ''}
                              onValueChange={(value) => updateShift(dateKey, member.id, 'area', value)}
                            >
                              <SelectTrigger className={`text-xs h-8 ${isExisting ? 'border-success/50 bg-success/5' : ''}`}>
                                <SelectValue placeholder="Select area" />
                              </SelectTrigger>
                              <SelectContent>
                                {SCHEDULE_AREAS.map((area) => (
                                  <SelectItem key={area.value} value={area.value}>
                                    {area.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="text"
                              placeholder="Notes (optional)"
                              value={shift?.notes || ''}
                              onChange={(e) => updateShift(dateKey, member.id, 'notes', e.target.value)}
                              className={`text-xs h-8 ${isExisting ? 'border-success/50 bg-success/5' : ''}`}
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