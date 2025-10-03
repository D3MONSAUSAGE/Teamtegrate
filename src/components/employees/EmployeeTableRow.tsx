import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreVertical, Shield, Crown, Users, User } from 'lucide-react';
import { Employee } from '@/hooks/employees/useEmployees';
import { format } from 'date-fns';

interface EmployeeTableRowProps {
  employee: Employee;
  onViewDetails: (employeeId: string) => void;
  onEdit: (employeeId: string) => void;
  onDelete: (employeeId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const roleConfig = {
  superadmin: { icon: Shield, variant: 'default' as const, color: 'text-purple-500' },
  admin: { icon: Shield, variant: 'destructive' as const, color: 'text-red-500' },
  manager: { icon: Crown, variant: 'default' as const, color: 'text-blue-500' },
  team_leader: { icon: Users, variant: 'secondary' as const, color: 'text-cyan-500' },
  user: { icon: User, variant: 'outline' as const, color: 'text-gray-500' },
};

export default function EmployeeTableRow({
  employee,
  onViewDetails,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: EmployeeTableRowProps) {
  const roleInfo = roleConfig[employee.role as keyof typeof roleConfig] || roleConfig.user;
  const RoleIcon = roleInfo.icon;

  return (
    <TableRow className="hover:bg-muted/50">
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
            <DropdownMenuItem onClick={() => onViewDetails(employee.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(employee.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(employee.id)}
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
}
