import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, User, Calendar, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  email: string;
}

export const EmployeeScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const { shiftTemplates, createEmployeeSchedule, isLoading } = useScheduleManagement();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    shift_template_id: '',
    scheduled_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organization_id || !formData.employee_id || !formData.shift_template_id || !formData.scheduled_date) {
      return;
    }

    try {
      const selectedShift = shiftTemplates.find(s => s.id === formData.shift_template_id);
      if (!selectedShift) return;

      // Calculate start and end times based on shift template and selected date
      const scheduledDate = new Date(formData.scheduled_date);
      const [startHour, startMinute] = selectedShift.start_time.split(':').map(Number);
      const [endHour, endMinute] = selectedShift.end_time.split(':').map(Number);
      
      const scheduledStartTime = new Date(scheduledDate);
      scheduledStartTime.setHours(startHour, startMinute, 0, 0);
      
      const scheduledEndTime = new Date(scheduledDate);
      scheduledEndTime.setHours(endHour, endMinute, 0, 0);
      
      // Handle overnight shifts
      if (endHour < startHour) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      }

      await createEmployeeSchedule({
        organization_id: user.organizationId,
        employee_id: formData.employee_id,
        shift_template_id: formData.shift_template_id,
        scheduled_date: formData.scheduled_date,
        scheduled_start_time: scheduledStartTime.toISOString(),
        scheduled_end_time: scheduledEndTime.toISOString(),
        status: 'scheduled',
        notes: formData.notes || undefined,
        created_by: user.id
      });

      toast.success('Shift assigned successfully');
      setIsAssignDialogOpen(false);
      setFormData({
        employee_id: '',
        shift_template_id: '',
        scheduled_date: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to assign shift');
    }
  };

  const generateQuickSchedules = () => {
    const today = new Date();
    const nextWeek = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nextWeek.map((date) => (
          <Card key={date.toISOString()} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {format(date, 'EEEE')}
              </CardTitle>
              <CardDescription>
                {format(date, 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      scheduled_date: format(date, 'yyyy-MM-dd')
                    });
                    setIsAssignDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Assign Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Scheduling</h2>
          <p className="text-muted-foreground">
            Assign shifts to employees and manage schedules
          </p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Employee Shift</DialogTitle>
              <DialogDescription>
                Assign a shift to an employee for a specific date
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAssignShift} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift_template">Shift Template</Label>
                <Select
                  value={formData.shift_template_id}
                  onValueChange={(value) => setFormData({ ...formData, shift_template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shift template" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {template.name} ({template.start_time} - {template.end_time})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  Assign Shift
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Schedule for Next Week */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Quick Schedule - Next 7 Days
        </h3>
        {generateQuickSchedules()}
      </div>

      {/* Employee List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Team Members
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{employee.name}</CardTitle>
                <CardDescription>{employee.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        employee_id: employee.id
                      });
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Assign Shift
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full">
                    View Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};