import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
import { User, UserPlus2 } from 'lucide-react';

interface UserAssignmentSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
}

const UserAssignmentSelector: React.FC<UserAssignmentSelectorProps> = ({
  selectedUserIds,
  onSelectionChange
}) => {
  const { users, isLoading } = useUsers();

  const handleUserToggle = (userId: string) => {
    console.log('Toggling user:', userId, 'Current selection:', selectedUserIds);
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded"></div>;
  }

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-4 w-4" />
          <Label className="text-base font-medium">Specific User Assignment</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Select specific users who can be assigned these requests. Requests will be manually assigned and accepted.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
          {users.map(user => (
            <div key={user.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
              <Checkbox
                id={`user-${user.id}`}
                checked={selectedUserIds.includes(user.id)}
                onCheckedChange={() => handleUserToggle(user.id)}
              />
              <div className="flex items-center gap-2 flex-1">
                <User className="h-4 w-4" />
                <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer text-sm">
                  {user.name}
                </Label>
                <span className="text-xs text-muted-foreground">({user.role})</span>
              </div>
            </div>
          ))}
        </div>

        {selectedUserIds.length > 0 && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium">Selected Users ({selectedUserIds.length})</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedUserIds.map(userId => {
                const user = users.find(u => u.id === userId);
                return user ? (
                  <Badge key={userId} variant="secondary" className="text-xs">
                    {user.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {selectedUserIds.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No specific users selected. Requests will use role-based assignment.
          </p>
        )}
      </div>
    </div>
  );
};

export default UserAssignmentSelector;