import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, DollarSign } from 'lucide-react';
import { User } from '@/types';
import { format } from 'date-fns';
import UserJobRolesCell from '@/components/organization/user-management/UserJobRolesCell';
import UserTeamsCell from '@/components/hr/UserTeamsCell';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeListViewProps {
  employees: User[];
  isLoading: boolean;
  onEditEmployee: (userId: string) => void;
}

const EmployeeListView: React.FC<EmployeeListViewProps> = ({
  employees,
  isLoading,
  onEditEmployee,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const { teams } = useTeamsByOrganization(user?.organizationId);

  // Fetch team memberships for filtering
  const { data: teamMemberships = [] } = useQuery({
    queryKey: ['team-memberships-for-filter', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const { data, error } = await supabase
        .from('team_memberships')
        .select('user_id, team_id');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  // Map employee IDs to their team IDs
  const employeeTeamMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    teamMemberships.forEach((membership) => {
      if (!map[membership.user_id]) {
        map[membership.user_id] = [];
      }
      map[membership.user_id].push(membership.team_id);
    });
    return map;
  }, [teamMemberships]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      // @ts-ignore
      const empStatus = emp.employment_status || 'active';
      const matchesStatus = statusFilter === 'all' || empStatus === statusFilter;

      const matchesTeam = 
        teamFilter === 'all' || 
        (employeeTeamMap[emp.id] && employeeTeamMap[emp.id].includes(teamFilter));

      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [employees, searchTerm, statusFilter, teamFilter, employeeTeamMap]);

  const getStatusBadge = (status?: string) => {
    const empStatus = status || 'active';
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      on_leave: 'secondary',
      terminated: 'destructive',
    };
    return (
      <Badge variant={variants[empStatus] || 'default'}>
        {empStatus.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'on_leave' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('on_leave')}
              size="sm"
            >
              On Leave
            </Button>
            <Button
              variant={statusFilter === 'terminated' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('terminated')}
              size="sm"
            >
              Terminated
            </Button>
          </div>
        </div>

        {/* Employee Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Roles</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <UserJobRolesCell userId={employee.id} />
                    </TableCell>
                    <TableCell>
                      <UserTeamsCell userId={employee.id} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono">
                        <DollarSign className="h-3 w-3" />
                        {/* @ts-ignore */}
                        {(employee.hourly_rate || 15).toFixed(2)}/hr
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* @ts-ignore */}
                      {getStatusBadge(employee.employment_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditEmployee(employee.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>
    </Card>
  );
};

export default EmployeeListView;
