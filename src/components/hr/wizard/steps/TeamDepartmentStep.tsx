import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeFormData } from '@/types/employee';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamDepartmentStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const TeamDepartmentStep: React.FC<TeamDepartmentStepProps> = ({ formData, onChange }) => {
  const { user } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeamsByOrganization(user?.organizationId);

  const [selectedTeamId, setSelectedTeamId] = React.useState('');
  const [selectedTeamRole, setSelectedTeamRole] = React.useState<'member' | 'manager'>('member');

  // Fetch managers
  const { data: managers = [], isLoading: managersLoading, error: managersError } = useQuery({
    queryKey: ['managers', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user.organizationId)
        .in('role', ['manager', 'admin', 'superadmin'])
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.organizationId,
  });

  const addTeamAssignment = () => {
    if (!selectedTeamId) return;

    const existingAssignment = formData.team_assignments.find(
      (a) => a.team_id === selectedTeamId
    );

    if (existingAssignment) return;

    onChange({
      team_assignments: [
        ...formData.team_assignments,
        { team_id: selectedTeamId, role: selectedTeamRole },
      ],
    });

    setSelectedTeamId('');
    setSelectedTeamRole('member');
  };

  const removeTeamAssignment = (teamId: string) => {
    onChange({
      team_assignments: formData.team_assignments.filter((a) => a.team_id !== teamId),
    });
  };

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || 'Unknown Team';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Team & Department</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Assign the employee to teams and set their department and manager.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department || ''}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="e.g., Engineering, Sales, HR"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manager_id">Manager</Label>
          <Select
            value={formData.manager_id || ''}
            onValueChange={(value) => onChange({ manager_id: value })}
            disabled={managersLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={managersLoading ? "Loading managers..." : "Select a manager (optional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Manager</SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {managersError && (
            <p className="text-xs text-destructive">Failed to load managers</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Team Assignments</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedTeamId} 
              onValueChange={setSelectedTeamId}
              disabled={teamsLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={teamsLoading ? "Loading teams..." : teams.length === 0 ? "No teams available" : "Select a team"} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTeamRole}
              onValueChange={(value) => setSelectedTeamRole(value as 'member' | 'manager')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={addTeamAssignment}
              disabled={!selectedTeamId || teamsLoading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {teams.length === 0 && !teamsLoading && (
            <p className="text-xs text-muted-foreground">
              No teams available. Create teams in the Organization page first.
            </p>
          )}

          {formData.team_assignments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.team_assignments.map((assignment) => (
                <Badge key={assignment.team_id} variant="secondary" className="gap-2">
                  {getTeamName(assignment.team_id)} ({assignment.role})
                  <button
                    type="button"
                    onClick={() => removeTeamAssignment(assignment.team_id)}
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

export default TeamDepartmentStep;
