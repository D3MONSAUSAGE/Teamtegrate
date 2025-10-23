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

  const [selectedTeamId, setSelectedTeamId] = React.useState<string | undefined>(undefined);
  const [selectedTeamRole, setSelectedTeamRole] = React.useState<'member' | 'manager'>('member');

  // Auto-reset to 'member' if selected team already has a manager
  React.useEffect(() => {
    if (selectedTeamId) {
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      if (selectedTeam?.manager_id && selectedTeamRole === 'manager') {
        setSelectedTeamRole('member');
      }
    }
  }, [selectedTeamId, teams, selectedTeamRole]);

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

    setSelectedTeamId(undefined);
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

  const getManagerName = (managerId: string | null | undefined) => {
    if (!managerId) return null;
    return managers.find((m) => m.id === managerId)?.name || null;
  };

  // Check if selected team has a manager
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamHasManager = selectedTeam?.manager_id != null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Team & Department</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Assign the employee to teams and optionally set their department.
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
                <SelectItem value="manager" disabled={teamHasManager}>
                  Manager {teamHasManager && '(Assigned)'}
                </SelectItem>
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
              {formData.team_assignments.map((assignment) => {
                const team = teams.find(t => t.id === assignment.team_id);
                const managerName = getManagerName(team?.manager_id);
                
                return (
                  <Badge key={assignment.team_id} variant="secondary" className="gap-2">
                    <span>
                      {getTeamName(assignment.team_id)} ({assignment.role})
                      {managerName && ` • Manager: ${managerName}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTeamAssignment(assignment.team_id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDepartmentStep;
