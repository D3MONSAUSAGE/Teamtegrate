import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import TimeSelector from '@/components/ui/time-selector';
import { WeekPicker } from '@/components/ui/week-picker';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, User, Calendar, Clock, Edit } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface EmployeeSchedule {
  id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  status: string;
  notes?: string;
  shift_template_id?: string;
}

export const EmployeeScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const { createEmployeeSchedule, isLoading } = useScheduleManagement();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [weeklySchedules, setWeeklySchedules] = useState<EmployeeSchedule[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EmployeeSchedule | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    scheduled_date: '',
    notes: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchWeeklySchedules();
    }
  }, [selectedEmployee, selectedWeek]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user?.organizationId)
        .neq('role', 'superadmin')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchWeeklySchedules = async () => {
    if (!selectedEmployee) return;
    
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', selectedEmployee)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date');

      if (error) throw error;
      setWeeklySchedules(data || []);
    } catch (error) {
      console.error('Failed to fetch weekly schedules:', error);
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation with user feedback
    console.log('Form submission data:', formData);
    
    if (!user?.organizationId) {
      toast.error('Organization ID is missing');
      return;
    }
    
    if (!formData.employee_id) {
      toast.error('Please select an employee');
      return;
    }
    
    if (!formData.scheduled_date) {
      toast.error('Please select a date');
      return;
    }
    
    if (!formData.start_time) {
      toast.error('Please set a start time');
      return;
    }
    
    if (!formData.end_time) {
      toast.error('Please set an end time');
      return;
    }

    try {
      // Calculate start and end times
      const scheduledDate = new Date(formData.scheduled_date);
      const startTime = formData.start_time;
      const endTime = formData.end_time;
      
      // Create full datetime objects
      const scheduledStartTime = new Date(`${formData.scheduled_date}T${startTime}`);
      const scheduledEndTime = new Date(`${formData.scheduled_date}T${endTime}`);
      
      // Handle overnight shifts (end time is before start time)
      if (scheduledEndTime <= scheduledStartTime) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      }

      const scheduleData = {
        organization_id: user.organizationId,
        employee_id: formData.employee_id,
        shift_template_id: null, // No longer using templates
        scheduled_date: formData.scheduled_date,
        scheduled_start_time: scheduledStartTime.toISOString(),
        scheduled_end_time: scheduledEndTime.toISOString(),
        status: 'scheduled',
        notes: formData.notes || undefined,
        created_by: user.id
      };

      console.log('Creating schedule with data:', scheduleData);

      await createEmployeeSchedule(scheduleData);

      toast.success('Shift assigned successfully');
      setIsAssignDialogOpen(false);
      setFormData({
        employee_id: '',
        scheduled_date: '',
        notes: '',
        start_time: '',
        end_time: ''
      });
      // Refresh the schedule view
      await fetchWeeklySchedules();
    } catch (error) {
      console.error('Shift assignment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to assign shift: ${errorMessage}`);
    }
  };

  const renderWeeklyScheduleGrid = () => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedWeek, { weekStartsOn: 1 })
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weekDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const daySchedule = weeklySchedules.find(schedule => 
            isSameDay(new Date(schedule.scheduled_date), date)
          );
          
          return (
            <Card key={dateStr} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {format(date, 'EEE')}
                </CardTitle>
                <CardDescription>
                  {format(date, 'MMM d')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {daySchedule ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {format(new Date(daySchedule.scheduled_start_time), 'HH:mm')} - 
                      {format(new Date(daySchedule.scheduled_end_time), 'HH:mm')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {daySchedule.status}
                    </div>
                    {daySchedule.notes && (
                      <div className="text-xs text-muted-foreground">
                        {daySchedule.notes}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setEditingSchedule(daySchedule);
                        setFormData({
                          employee_id: selectedEmployee,
                          scheduled_date: dateStr,
                          notes: daySchedule.notes || '',
                          start_time: format(new Date(daySchedule.scheduled_start_time), 'HH:mm'),
                          end_time: format(new Date(daySchedule.scheduled_end_time), 'HH:mm')
                        });
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit Shift
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setFormData({
                        employee_id: selectedEmployee,
                        scheduled_date: dateStr,
                        notes: '',
                        start_time: '',
                        end_time: ''
                      });
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add Shift
                  </Button>
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Employee Scheduling</h2>
        <p className="text-muted-foreground">
          Select an employee and week to manage their schedule
        </p>
      </div>

      {/* Step 1: Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an employee to schedule" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {employee.name} ({employee.email})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Week Selection */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeekPicker 
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Weekly Schedule Grid */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              {employees.find(e => e.id === selectedEmployee)?.name}'s schedule for the week of {format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderWeeklyScheduleGrid()}
          </CardContent>
        </Card>
      )}
        
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
          <DialogTitle>
            {editingSchedule ? 'Edit Shift' : 'Assign New Shift'}
          </DialogTitle>
          <DialogDescription>
            {editingSchedule ? 'Update shift details' : 'Assign a shift to an employee for a specific date'}
          </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAssignShift} className="space-y-4">
              {/* Show selected employee info */}
              {formData.employee_id && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {employees.find(e => e.id === formData.employee_id)?.name}
                    </span>
                  </div>
                </div>
              )}


              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label className="text-base font-medium">Shift Times</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <TimeSelector
                      value={formData.start_time}
                      onChange={(time) => setFormData({ ...formData, start_time: time })}
                      placeholder="Select start time"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <TimeSelector
                      value={formData.end_time}
                      onChange={(time) => setFormData({ ...formData, end_time: time })}
                      placeholder="Select end time"
                    />
                  </div>
                </div>
                
                {formData.start_time && formData.end_time && (
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const [startHour] = formData.start_time.split(':').map(Number);
                      const [endHour] = formData.end_time.split(':').map(Number);
                      return endHour < startHour ? 'This is an overnight shift (ends next day)' : 'Same day shift';
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for this shift"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingSchedule ? 'Update Shift' : 'Assign Shift'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
};