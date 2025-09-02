import React, { useState } from 'react';
import { useJobRoles } from '@/hooks/useJobRoles';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, Crown } from 'lucide-react';
import { toast } from 'sonner';

export const BulkUserAssignment: React.FC = () => {
  const { jobRoles } = useJobRoles();
  const { users } = useEnhancedUserManagement();
  const { assignJobRole, isAssigning } = useUserJobRoles();
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [setPrimary, setSetPrimary] = useState(false);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users?.map(user => user.id) || []);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    if (!selectedRole) {
      toast.error('Please select a job role');
      return;
    }

    try {
      // Assign role to each selected user
      for (const userId of selectedUsers) {
        assignJobRole({ targetUserId: userId, jobRoleId: selectedRole, isPrimary: setPrimary });
        // Simple delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success(`Successfully assigned role to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`);
      setSelectedUsers([]);
      setSelectedRole('');
      setSetPrimary(false);
    } catch (error) {
      toast.error('Failed to assign roles to some users');
    }
  };

  const activeJobRoles = jobRoles.filter(role => role.is_active);
  const selectedRoleData = activeJobRoles.find(role => role.id === selectedRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Job Role Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Job Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job role to assign" />
              </SelectTrigger>
              <SelectContent>
                {activeJobRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRoleData?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRoleData.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="setPrimary" 
              checked={setPrimary}
              onCheckedChange={(checked) => setSetPrimary(checked === true)}
            />
            <label htmlFor="setPrimary" className="text-sm font-medium flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Set as primary role for selected users
            </label>
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Select Users ({selectedUsers.length} selected)</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedUsers.length === users?.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-md">
            {users?.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-3 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
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
                
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUsers([]);
              setSelectedRole('');
              setSetPrimary(false);
            }}
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleBulkAssign}
            disabled={selectedUsers.length === 0 || !selectedRole || isAssigning}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isAssigning ? 'Assigning...' : `Assign to ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};