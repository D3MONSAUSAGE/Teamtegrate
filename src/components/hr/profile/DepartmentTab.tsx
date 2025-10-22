import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DepartmentTabProps {
  userId: string;
}

const DepartmentTab: React.FC<DepartmentTabProps> = ({ userId }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [department, setDepartment] = useState('');

  const { data: employee } = useQuery({
    queryKey: ['employee-department', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('department, manager_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      let managerName = null;
      if (data.manager_id) {
        const { data: manager } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.manager_id)
          .single();
        managerName = manager?.name;
      }

      return { ...data, manager_name: managerName };
    },
  });

  useEffect(() => {
    if (employee) {
      setDepartment(employee.department || '');
    }
  }, [employee]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ department })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Department updated successfully');
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Department Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Manage the employee's department assignment.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <div className="flex gap-2 items-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Engineering, Sales, HR"
              className="flex-1"
            />
          </div>
        </div>

        {employee?.manager_id && (
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-semibold">Department Manager</span>
            </div>
            <p className="text-sm font-medium ml-6">
              {employee.manager_name || 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground ml-6">
              Update manager assignment in the Manager tab
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default DepartmentTab;
