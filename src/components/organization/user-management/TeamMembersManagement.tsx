import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployees, EmployeeFilters } from '@/hooks/employees/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CreateEmployeeDialog from '@/components/employees/CreateEmployeeDialog';
import EditEmployeeDialog from '@/components/employees/EditEmployeeDialog';
import DeleteEmployeeDialog from '@/components/employees/DeleteEmployeeDialog';
import EmployeeDetailsDialog from '@/components/employees/EmployeeDetailsDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreVertical, Shield, Crown, Users, User } from 'lucide-react';
import { format } from 'date-fns';

const roleConfig = {
  superadmin: { icon: Shield, variant: 'default' as const, color: 'text-purple-500' },
  admin: { icon: Shield, variant: 'destructive' as const, color: 'text-red-500' },
  manager: { icon: Crown, variant: 'default' as const, color: 'text-blue-500' },
  team_leader: { icon: Users, variant: 'secondary' as const, color: 'text-cyan-500' },
  user: { icon: User, variant: 'outline' as const, color: 'text-gray-500' },
};

export default function TeamMembersManagement() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isManager = user?.role === 'manager' || isAdmin;

  const { data: employees, isLoading, error } = useEmployees(filters);

  const { data: teams } = useQuery({
    queryKey: ['teams', user?.organizationId],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user!.organizationId)
        .eq('is_active', true);
      
      if (!isAdmin) {
        query = query.eq('manager_id', user!.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.organizationId,
  });

  const handleViewDetails = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setEditDialogOpen(true);
  };

  const handleDelete = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setDeleteDialogOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleTeamChange = (value: string) => {
    setFilters({ ...filters, teamId: value === 'all' ? undefined : value });
  };

  const handleRoleChange = (value: string) => {
    setFilters({ ...filters, role: value === 'all' ? undefined : value });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-3xl">👥</span>
            Team Members
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? 'Manage your organization\'s team members' : 'View team members in your teams'}
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Filters */}
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

        {!isAdmin && (
          <div className="bg-muted/50 border border-border rounded-md p-3">
            <p className="text-sm text-muted-foreground">
              📌 You're viewing team members in teams you manage. Contact an admin to make changes.
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">Error loading team members</p>
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <span className="text-5xl">👥</span>
            <p className="text-muted-foreground">No team members found</p>
            <p className="text-sm text-muted-foreground">
              {filters.search || filters.teamId || filters.role
                ? 'Try adjusting your filters'
                : 'Get started by adding team members'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const roleInfo = roleConfig[employee.role as keyof typeof roleConfig] || roleConfig.user;
                const RoleIcon = roleInfo.icon;

                return (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback className="text-sm font-medium">
                            {employee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{employee.name}</span>
                          <span className="text-xs text-muted-foreground">{employee.email}</span>
                          {employee.employee_id && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              ID: {employee.employee_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={roleInfo.variant} className="gap-1.5">
                        <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                        {employee.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm">{employee.department || '—'}</span>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {employee.teams && employee.teams.length > 0 ? (
                          employee.teams.slice(0, 3).map((tm: any) => (
                            <Badge key={tm.team.id} variant="outline" className="text-xs">
                              {tm.team.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No teams</span>
                        )}
                        {employee.teams && employee.teams.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{employee.teams.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm">
                        {employee.hire_date ? format(new Date(employee.hire_date), 'MMM d, yyyy') : '—'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(employee.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => handleEdit(employee.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(employee.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogs */}
      <CreateEmployeeDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedEmployeeId && (
        <>
          <EditEmployeeDialog 
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            employeeId={selectedEmployeeId}
          />

          <DeleteEmployeeDialog 
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            employeeId={selectedEmployeeId}
          />

          <EmployeeDetailsDialog 
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            employeeId={selectedEmployeeId}
          />
        </>
      )}
    </div>
  );
}
