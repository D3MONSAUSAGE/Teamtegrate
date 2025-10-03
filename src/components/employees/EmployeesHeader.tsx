import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeesHeaderProps {
  onCreateClick: () => void;
  canCreate: boolean;
}

export default function EmployeesHeader({ onCreateClick, canCreate }: EmployeesHeaderProps) {
  return (
    <div className="border-b border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-3xl">👥</span>
            Employees
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canCreate ? 'Manage your organization\'s employees' : 'View employees in your teams'}
          </p>
        </div>
        
        {canCreate && (
          <Button onClick={onCreateClick} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>
    </div>
  );
}
