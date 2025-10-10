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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EmployeeProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmployeeFormData {
  name: string;
  email: string;
  job_title: string;
  department: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    job_title: '',
    department: '',
    hourly_rate: 15,
    hire_date: '',
    employment_status: 'active',
    salary_type: 'hourly',
    hr_notes: '',
  });

  useEffect(() => {
    if (userId && open) {
      loadEmployeeData();
    } else if (!userId && open) {
      // Reset form for new employee
      setFormData({
        name: '',
        email: '',
        job_title: '',
        department: '',
        hourly_rate: 15,
        hire_date: '',
        employment_status: 'active',
        salary_type: 'hourly',
        hr_notes: '',
      });
    }
  }, [userId, open]);

  const loadEmployeeData = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        email: data.email || '',
        job_title: data.job_title || '',
        department: data.department || '',
        hourly_rate: data.hourly_rate || 15,
        hire_date: data.hire_date || '',
        employment_status: data.employment_status || 'active',
        salary_type: data.salary_type || 'hourly',
        hr_notes: data.hr_notes || '',
      });
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setIsLoading(false);
    }
  };

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
          job_title: formData.job_title,
          department: formData.department,
          hourly_rate: formData.hourly_rate,
          hire_date: formData.hire_date || null,
          employment_status: formData.employment_status,
          salary_type: formData.salary_type,
          hr_notes: formData.hr_notes,
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Employee record updated successfully');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userId ? 'Edit Employee Record' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            Update employee information, pay rates, and HR details
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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

            {/* Job Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Job Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) =>
                      setFormData({ ...formData, job_title: e.target.value })
                    }
                    placeholder="Manager, Cashier, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Sales, Operations, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) =>
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_status">Employment Status</Label>
                  <Select
                    value={formData.employment_status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, employment_status: value })
                    }
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

            {/* Compensation */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_type">Salary Type</Label>
                  <Select
                    value={formData.salary_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, salary_type: value })
                    }
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
                    Used for payroll calculations
                  </p>
                </div>
              </div>
            </div>

            {/* HR Notes */}
            <div className="space-y-2">
              <Label htmlFor="hr_notes">Internal HR Notes</Label>
              <Textarea
                id="hr_notes"
                value={formData.hr_notes}
                onChange={(e) =>
                  setFormData({ ...formData, hr_notes: e.target.value })
                }
                placeholder="Internal notes, performance observations, etc."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These notes are only visible to HR administrators
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProfileDialog;
