import React, { useState } from 'react';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { userManagementService } from '@/services/userManagementService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserCog, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_OPTIONS: UserRole[] = ['user', 'team_leader', 'manager', 'admin'];

export const BulkUserRoleUpdate: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, refetchUsers } = useEnhancedUserManagement();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isSuperadmin = currentUser?.role === 'superadmin';
  const availableRoles = isSuperadmin ? [...ROLE_OPTIONS, 'superadmin'] : ROLE_OPTIONS;

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const eligibleUsers = users?.filter(user => 
      user.id !== currentUser?.id && // Can't select self
      (isSuperadmin || user.role !== 'superadmin') // Non-superadmins can't select superadmins
    );
    
    if (selectedUsers.length === eligibleUsers?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(eligibleUsers?.map(user => user.id) || []);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setIsUpdating(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Update roles one by one for better error handling
      for (const userId of selectedUsers) {
        try {
          await userManagementService.changeUserRole(userId, selectedRole);
          successCount++;
          // Add small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to update role for user ${userId}:`, error);
          errorCount++;
        }
      }

      // Refresh user data
      await refetchUsers();

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} user role${successCount > 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} user role${errorCount > 1 ? 's' : ''}`);
      }

      // Reset form
      setSelectedUsers([]);
      setSelectedRole('');
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to complete bulk update');
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedUsersData = users?.filter(user => selectedUsers.includes(user.id)) || [];
  const hasRiskyChanges = selectedUsersData.some(user => 
    (user.role === 'superadmin' && selectedRole !== 'superadmin') ||
    (user.role !== 'superadmin' && selectedRole === 'superadmin')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Bulk User Role Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select New Role</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role to assign" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                    {role === 'superadmin' && <span className="ml-2 text-xs text-amber-600">(Superadmin)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole === 'superadmin' && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-amber-800">
                  Warning: Assigning superadmin role grants full system access.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Select Users ({selectedUsers.length} selected)
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedUsers.length === users?.filter(u => u.id !== currentUser?.id)?.length 
                ? 'Deselect All' 
                : 'Select All'
              }
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-md">
            {users?.filter(user => user.id !== currentUser?.id).map((user) => {
              const canSelect = isSuperadmin || user.role !== 'superadmin';
              
              return (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-3 border-b last:border-b-0 ${
                    !canSelect ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => canSelect && handleUserToggle(user.id)}
                      disabled={!canSelect}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={user.role === 'superadmin' ? 'destructive' : 'outline'}
                      className="text-xs capitalize"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                    {!canSelect && (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning for risky changes */}
        {hasRiskyChanges && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Warning: High-risk role changes detected</p>
              <p className="text-xs mt-1">
                You are changing superadmin roles. This will affect system administration capabilities.
              </p>
            </div>
          </div>
        )}

        {/* Update Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUsers([]);
              setSelectedRole('');
            }}
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={selectedUsers.length === 0 || !selectedRole || isUpdating}
          >
            <Users className="h-4 w-4 mr-2" />
            {isUpdating 
              ? 'Updating...' 
              : `Update ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};