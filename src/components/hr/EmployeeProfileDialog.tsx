import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Briefcase, DollarSign, FileText, UserCog, Users, Crown } from 'lucide-react';
import { UserJobRoleManager } from '@/components/organization/UserJobRoleManager';
import { UserTeamManager } from '@/components/hr/UserTeamManager';
import { UserManagerDisplay } from '@/components/hr/UserManagerDisplay';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TimeOffTab from './profile/TimeOffTab';
import EmergencyContactTab from './profile/EmergencyContactTab';
import DepartmentTab from './profile/DepartmentTab';
import OffboardingTab from './profile/OffboardingTab';

interface EmployeeProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmployeeFormData {
  name: string;
  email: string;
  hourly_rate: number;
  hire_date: string;
  employment_status: string;
  salary_type: string;
  hr_notes: string;
}

const EmployeeProfileDialog: React.FC<EmployeeProfileDialogProps> = ({
  userId,
  open,
  onOpenChange,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    hourly_rate: 15,
    hire_date: '',
    employment_status: 'active',
    salary_type: 'hourly',
    hr_notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch employee data
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });


  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        hourly_rate: employee.hourly_rate || 15,
        hire_date: employee.hire_date || '',
        employment_status: employee.employment_status || 'active',
        salary_type: employee.salary_type || 'hourly',
        hr_notes: employee.hr_notes || '',
      });
    }
  }, [employee]);

  const handleSave = async () => {
    if (!userId) {
      toast.error('Cannot update: No employee selected');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          hourly_rate: formData.hourly_rate,
          hire_date: formData.hire_date || null,
          employment_status: formData.employment_status,
          salary_type: formData.salary_type,
          hr_notes: formData.hr_notes,
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Employee record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['employee', userId] });
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Employee Profile - {employee?.name}</DialogTitle>
          <DialogDescription>
            Manage employee information, job roles, teams, and compensation
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-10 text-xs">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="job-roles">Job Roles</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="manager">Manager</TabsTrigger>
              <TabsTrigger value="compensation">Pay</TabsTrigger>
              <TabsTrigger value="time-off">Time Off</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
              <TabsTrigger value="offboarding">Offboarding</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Job Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employment_status">Employment Status</Label>
                    <Select
                      value={formData.employment_status}
                      onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Job Roles Tab */}
            <TabsContent value="job-roles" className="space-y-4">
              {employee && (
                <UserJobRoleManager 
                  userId={employee.id} 
                  userName={employee.name}
                />
              )}
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams" className="space-y-4">
              {employee && (
                <UserTeamManager 
                  userId={employee.id} 
                  userName={employee.name}
                />
              )}
            </TabsContent>

            {/* Manager Tab */}
            <TabsContent value="manager" className="space-y-4">
              {employee && (
                <UserManagerDisplay 
                  userId={employee.id} 
                  userName={employee.name}
                />
              )}
            </TabsContent>

            {/* Compensation Tab */}
            <TabsContent value="compensation" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Compensation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary_type">Salary Type</Label>
                    <Select
                      value={formData.salary_type}
                      onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($) *</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="15.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for payroll calculations and time tracking
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Time Off Tab */}
            <TabsContent value="time-off" className="space-y-4">
              {employee && <TimeOffTab userId={employee.id} />}
            </TabsContent>

            {/* Emergency Contact Tab */}
            <TabsContent value="emergency" className="space-y-4">
              {employee && <EmergencyContactTab userId={employee.id} />}
            </TabsContent>

            {/* Department Tab */}
            <TabsContent value="department" className="space-y-4">
              {employee && <DepartmentTab userId={employee.id} />}
            </TabsContent>

            {/* Offboarding Tab */}
            <TabsContent value="offboarding" className="space-y-4">
              {employee && <OffboardingTab userId={employee.id} userName={employee.name} />}
            </TabsContent>

            {/* HR Notes Tab */}
            <TabsContent value="notes" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hr_notes">Internal HR Notes</Label>
                <Textarea
                  id="hr_notes"
                  value={formData.hr_notes}
                  onChange={(e) => setFormData({ ...formData, hr_notes: e.target.value })}
                  placeholder="Internal notes, performance observations, etc."
                  rows={10}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  These notes are only visible to HR administrators and managers
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProfileDialog;
