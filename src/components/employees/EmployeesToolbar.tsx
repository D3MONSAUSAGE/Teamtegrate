import { Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeFilters } from '@/pages/EmployeesPage';

interface EmployeesToolbarProps {
  filters: EmployeeFilters;
  onFiltersChange: (filters: EmployeeFilters) => void;
  isManager: boolean;
}

export default function EmployeesToolbar({ filters, onFiltersChange, isManager }: EmployeesToolbarProps) {
  const { user } = useAuth();

  const { data: teams } = useQuery({
    queryKey: ['teams', user?.organizationId],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user!.organizationId)
        .eq('is_active', true);
      
      if (isManager) {
        query = query.eq('manager_id', user!.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.organizationId,
  });

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleTeamChange = (value: string) => {
    onFiltersChange({ ...filters, teamId: value === 'all' ? undefined : value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role: value === 'all' ? undefined : value });
  };

  return (
    <div className="border-b border-border bg-card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filters.teamId || 'all'} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="superadmin">Superadmin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="team_leader">Team Leader</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isManager && (
          <div className="bg-muted/50 border border-border rounded-md p-3">
            <p className="text-sm text-muted-foreground">
              📌 You're viewing employees in teams you manage. Contact an admin to make changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
