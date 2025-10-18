import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentAssignments } from '@/hooks/document-templates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AssignTemplateDialogProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AssignmentType = 'employee' | 'role' | 'team';

export const AssignTemplateDialog = ({ templateId, templateName, open, onOpenChange }: AssignTemplateDialogProps) => {
  const { user } = useAuth();
  const { createAssignment } = useDocumentAssignments();
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('employee');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees', user?.organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('organization_id', user?.organizationId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.organizationId && open,
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams', user?.organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user?.organizationId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.organizationId && open,
  });

  const roles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'team_leader', label: 'Team Leader' },
    { value: 'admin', label: 'Admin' },
  ];

  const handleSubmit = async () => {
    const assignment: any = {
      template_id: templateId,
    };

    if (assignmentType === 'employee') {
      if (!selectedEmployee) return;
      assignment.employee_id = selectedEmployee;
    } else if (assignmentType === 'role') {
      if (!selectedRole) return;
      assignment.role = selectedRole;
    } else if (assignmentType === 'team') {
      if (!selectedTeam) return;
      assignment.team_id = selectedTeam;
    }

    await createAssignment.mutateAsync(assignment);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setAssignmentType('employee');
    setSelectedEmployee('');
    setSelectedRole('');
    setSelectedTeam('');
  };

  const canSubmit = () => {
    if (assignmentType === 'employee') return !!selectedEmployee;
    if (assignmentType === 'role') return !!selectedRole;
    if (assignmentType === 'team') return !!selectedTeam;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Template: {templateName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Assignment Type</Label>
            <RadioGroup value={assignmentType} onValueChange={(value) => setAssignmentType(value as AssignmentType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="employee" />
                <Label htmlFor="employee" className="font-normal cursor-pointer">
                  Specific Employee
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="role" id="role" />
                <Label htmlFor="role" className="font-normal cursor-pointer">
                  All Employees with Role
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team" className="font-normal cursor-pointer">
                  All Employees in Team
                </Label>
              </div>
            </RadioGroup>
          </div>

          {assignmentType === 'employee' && (
            <div className="space-y-2">
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assignmentType === 'role' && (
            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This template will be assigned to all current and future employees with this role.
              </p>
            </div>
          )}

          {assignmentType === 'team' && (
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This template will be assigned to all current and future members of this team.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit() || createAssignment.isPending}>
            {createAssignment.isPending ? 'Assigning...' : 'Assign Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
