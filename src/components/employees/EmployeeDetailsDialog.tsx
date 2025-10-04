import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Phone, MapPin, Calendar, Briefcase, Building2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

export default function EmployeeDetailsDialog({ open, onOpenChange, employeeId }: EmployeeDetailsDialogProps) {
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee-details', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          teams:team_memberships(
            team:teams(id, name)
          )
        `)
        .eq('id', employeeId)
        .single();
      
      if (error) throw error;

      // Fetch manager separately to avoid circular type reference
      let managerData = null;
      if (data.manager_id) {
        const { data: manager } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', data.manager_id)
          .single();
        managerData = manager;
      }
      
      return { ...data, manager: managerData };
    },
    enabled: open && !!employeeId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : employee ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={employee.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {employee.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{employee.name}</h3>
                <p className="text-muted-foreground">{employee.email}</p>
                {employee.employee_id && (
                  <p className="text-sm text-muted-foreground">ID: {employee.employee_id}</p>
                )}
              </div>
              <Badge className="h-fit">{employee.role}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {employee.job_title && (
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Job Title</p>
                    <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                  </div>
                </div>
              )}

              {employee.department && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{employee.department}</p>
                  </div>
                </div>
              )}

              {employee.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{employee.phone}</p>
                  </div>
                </div>
              )}

              {employee.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{employee.location}</p>
                  </div>
                </div>
              )}

              {employee.hire_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Hire Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(employee.hire_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {employee.manager && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">
                      {Array.isArray(employee.manager) 
                        ? employee.manager[0]?.name || '—'
                        : (employee.manager as any)?.name || '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {employee.teams && employee.teams.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Teams</p>
                <div className="flex flex-wrap gap-2">
                  {employee.teams.map((tm: any) => (
                    <Badge key={tm.team.id} variant="outline">
                      {tm.team.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {employee.address && (
              <div>
                <p className="text-sm font-medium mb-1">Address</p>
                <p className="text-sm text-muted-foreground">{employee.address}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Employee not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
