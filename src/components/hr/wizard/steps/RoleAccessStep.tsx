import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeFormData } from '@/types/employee';
import { UserRole } from '@/types';
import { useJobRoles } from '@/hooks/useJobRoles';
import { Badge } from '@/components/ui/badge';
import { X, Briefcase } from 'lucide-react';

interface RoleAccessStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const RoleAccessStep: React.FC<RoleAccessStepProps> = ({ formData, onChange }) => {
  const { jobRoles, isLoading: jobRolesLoading } = useJobRoles();
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');

  const addJobRole = () => {
    if (!selectedJobRoleId) return;
    
    const currentRoles = formData.job_role_ids || [];
    if (currentRoles.includes(selectedJobRoleId)) return;
    
    onChange({ job_role_ids: [...currentRoles, selectedJobRoleId] });
    setSelectedJobRoleId('');
  };

  const removeJobRole = (roleId: string) => {
    onChange({ 
      job_role_ids: (formData.job_role_ids || []).filter(id => id !== roleId) 
    });
  };

  const getJobRoleName = (roleId: string) => {
    return jobRoles.find(r => r.id === roleId)?.name || 'Unknown Role';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Role & Access</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure the employee's system role and job positions. They will be invited to the platform later.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">
            System Role <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.role}
            onValueChange={(value) => onChange({ role: value as UserRole })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Team Member</SelectItem>
              <SelectItem value="team_leader">Team Leader</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Determines what features and data the employee can access when they join
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_roles">
            Job Roles <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <div className="flex gap-2">
            <Select 
              value={selectedJobRoleId} 
              onValueChange={setSelectedJobRoleId}
              disabled={jobRolesLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                {jobRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={addJobRole}
              disabled={!selectedJobRoleId || jobRolesLoading}
            >
              <Briefcase className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Assign organizational job roles from the Organization page
          </p>

          {(formData.job_role_ids && formData.job_role_ids.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.job_role_ids.map((roleId) => (
                <Badge key={roleId} variant="secondary" className="gap-2">
                  {getJobRoleName(roleId)}
                  <button
                    type="button"
                    onClick={() => removeJobRole(roleId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleAccessStep;
