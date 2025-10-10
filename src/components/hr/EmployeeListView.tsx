import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, DollarSign, Briefcase } from 'lucide-react';
import { User } from '@/types';
import { format } from 'date-fns';
import UserJobRolesCell from '@/components/organization/user-management/UserJobRolesCell';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // @ts-ignore
        (emp.job_title && emp.job_title.toLowerCase().includes(searchTerm.toLowerCase()));

      // @ts-ignore
      const empStatus = emp.employment_status || 'active';
      const matchesStatus = statusFilter === 'all' || empStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

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
          </div>
        </div>

        {/* Employee Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Title</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {/* @ts-ignore */}
                        {employee.job_title || 'Not set'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserJobRolesCell userId={employee.id} />
                    </TableCell>
                    <TableCell>
                      {/* Teams placeholder - will show team count */}
                      <span className="text-sm text-muted-foreground">View in profile</span>
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
