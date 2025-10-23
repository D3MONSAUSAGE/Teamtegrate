import React, { useState } from 'react';
import { useJobRoles } from '@/hooks/useJobRoles';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Star, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserJobRoleManagerProps {
  userId: string;
  userName: string;
}

export const UserJobRoleManager: React.FC<UserJobRoleManagerProps> = ({ userId, userName }) => {
  const { jobRoles } = useJobRoles();
  const {
    userJobRoles,
    primaryJobRole,
    canManageJobRoles,
    assignJobRole,
    removeJobRole,
    setPrimaryJobRole,
    isAssigning,
    isRemoving,
    isLoading
  } = useUserJobRoles(userId);

  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string>('');

  const availableJobRoles = jobRoles.filter(
    role => !userJobRoles.some(ujr => ujr.job_role_id === role.id)
  );

  const handleAssignRole = () => {
    if (!selectedJobRoleId) {
      toast.error('Please select a job role');
      return;
    }

    const isPrimaryRole = userJobRoles.length === 0; // First role becomes primary
    assignJobRole({
      targetUserId: userId,
      jobRoleId: selectedJobRoleId,
      isPrimary: isPrimaryRole
    });
    setSelectedJobRoleId('');
  };

  const handleSetPrimary = (jobRoleId: string) => {
    setPrimaryJobRole({
      targetUserId: userId,
      jobRoleId
    });
  };

  if (!canManageJobRoles) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Job Roles - {userName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Job Roles */}
        <div className="space-y-3">
          <h4 className="font-medium">Current Job Roles</h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userJobRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No job roles assigned</p>
          ) : (
            <div className="space-y-2">
              {userJobRoles.map((userJobRole) => (
                <div
                  key={userJobRole.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{userJobRole.job_role?.name}</span>
                        {userJobRole.is_primary && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      {userJobRole.job_role?.description && (
                        <p className="text-sm text-muted-foreground">
                          {userJobRole.job_role.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!userJobRole.is_primary && userJobRoles.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(userJobRole.job_role_id)}
                        disabled={isRemoving}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Make Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeJobRole(userJobRole.id)}
                      disabled={isRemoving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Job Role */}
        {availableJobRoles.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Assign Job Role</h4>
            <div className="flex items-center space-x-2">
              <Select value={selectedJobRoleId} onValueChange={setSelectedJobRoleId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a job role to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableJobRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        {role.description && (
                          <div className="text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedJobRoleId || isAssigning}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAssigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};