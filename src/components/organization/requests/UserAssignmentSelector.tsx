import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { User, UserPlus2 } from 'lucide-react';

interface UserAssignmentSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  assignmentStrategy?: string;
  onStrategyChange?: (strategy: string) => void;
}

const ASSIGNMENT_STRATEGIES = [
  { id: 'first_available', label: 'First Available', description: 'Assign to the first available person' },
  { id: 'round_robin', label: 'Round Robin', description: 'Distribute evenly among assignees' },
  { id: 'least_busy', label: 'Least Busy', description: 'Assign to person with fewest active requests' },
  { id: 'manual', label: 'Manual Assignment', description: 'Manager assigns manually' },
];

const UserAssignmentSelector: React.FC<UserAssignmentSelectorProps> = ({
  selectedUserIds,
  onSelectionChange,
  assignmentStrategy = 'first_available',
  onStrategyChange
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

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded"></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus2 className="h-4 w-4" />
            Specific User Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select specific users who can be assigned these requests (optional).
          </p>
          
          <div className="space-y-3">
            <Label>Select Users</Label>
            <Select onValueChange={(value) => {
              console.log('User selected:', value);
              handleUserToggle(value);
            }}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Choose a user to add..." />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-popover border shadow-lg">
                {users
                  .filter(user => !selectedUserIds.includes(user.id))
                  .map(user => (
                    <SelectItem key={user.id} value={user.id} className="hover:bg-accent cursor-pointer">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">({user.role})</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Users ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Badge clicked for user:', user.id);
                      handleUserToggle(user.id);
                    }}
                  >
                    {user.name} ({user.role}) ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedUserIds.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No specific users selected. Requests will use role-based assignment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Assignment Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              How should requests be assigned when multiple people are eligible?
            </p>
            <Select value={assignmentStrategy} onValueChange={(value) => {
              console.log('Assignment strategy changed:', value);
              onStrategyChange?.(value);
            }}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-popover border shadow-lg">
                {ASSIGNMENT_STRATEGIES.map(strategy => (
                  <SelectItem key={strategy.id} value={strategy.id} className="hover:bg-accent cursor-pointer">
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-muted-foreground">{strategy.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAssignmentSelector;