import React, { useState } from 'react';
import { useJobRoles } from '@/hooks/useJobRoles';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Crown } from 'lucide-react';
import JobRoleBadge from '@/components/JobRoleBadge';
import { toast } from 'sonner';

export const JobRoleAssignmentDashboard: React.FC = () => {
  const { jobRoles } = useJobRoles();
  const { users } = useEnhancedUserManagement();
  const { assignJobRole, removeJobRole, setPrimaryJobRole, isAssigning } = useUserJobRoles();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleQuickAssign = () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both a user and a job role');
      return;
    }

    assignJobRole({ targetUserId: selectedUser, jobRoleId: selectedRole, isPrimary: false });
    setSelectedUser('');
    setSelectedRole('');
  };

  const handleSetPrimary = (userId: string, roleId: string) => {
    setPrimaryJobRole({ targetUserId: userId, jobRoleId: roleId });
  };

  const handleRemoveRole = (userJobRoleId: string) => {
    if (confirm('Are you sure you want to remove this job role assignment?')) {
      removeJobRole(userJobRoleId);
    }
  };

  // We'll use a simple approach for now since we don't have userJobRoles in EnhancedUser
  // This would need to be enhanced to fetch user job roles for the dashboard
  
  return (
    <div className="space-y-6">
      {/* Quick Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Quick Job Role Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.filter(role => role.is_active).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleQuickAssign} 
              disabled={!selectedUser || !selectedRole || isAssigning}
              className="sm:w-auto w-full"
            >
              {isAssigning ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Roles Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobRoles.filter(role => role.is_active).map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  View Details
                </Badge>
              </div>
              {role.description && (
                <p className="text-sm text-muted-foreground">{role.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                Use the user management section to assign users to this role
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {users?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};