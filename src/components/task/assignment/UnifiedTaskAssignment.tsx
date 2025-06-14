
import React, { useState, useMemo } from 'react';
import { User } from '@/types';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, X, Plus, UserCheck } from 'lucide-react';
import { useUnifiedTaskAssignment } from '@/hooks/useUnifiedTaskAssignment';

interface UnifiedTaskAssignmentProps {
  taskId?: string;
  selectedUsers: User[];
  onSelectionChange: (users: User[]) => void;
  availableUsers: User[];
  isLoading?: boolean;
  disabled?: boolean;
}

const UnifiedTaskAssignment: React.FC<UnifiedTaskAssignmentProps> = ({
  taskId,
  selectedUsers,
  onSelectionChange,
  availableUsers,
  isLoading = false,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { assignTask, unassignTask, isAssigning } = useUnifiedTaskAssignment();

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return availableUsers;
    
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user => {
      const name = user.name || user.email;
      return name.toLowerCase().includes(query) || 
             user.email.toLowerCase().includes(query);
    });
  }, [availableUsers, searchQuery]);

  const availableFilteredUsers = filteredUsers.filter(
    user => !selectedUsers.some(selected => selected.id === user.id)
  );

  const handleAddUser = (user: User) => {
    onSelectionChange([...selectedUsers, user]);
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter(user => user.id !== userId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleApplyAssignment = async () => {
    if (!taskId) return;
    
    if (selectedUsers.length === 0) {
      await unassignTask(taskId);
    } else {
      await assignTask(taskId, selectedUsers);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Task Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading team members...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Task Assignment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Assign this task to team members. You can select multiple people for collaborative tasks.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Currently Selected */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Assigned Members ({selectedUsers.length})
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={disabled || isAssigning}
                className="h-7 text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.name || user.email).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{user.name || user.email}</span>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(user.id)}
                    disabled={disabled || isAssigning}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Members */}
        {availableFilteredUsers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Available Members</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {availableFilteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.name || user.email).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm">{user.name || user.email}</span>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddUser(user)}
                    disabled={disabled || isAssigning}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {availableFilteredUsers.length === 0 && searchQuery && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Empty state */}
        {selectedUsers.length === 0 && availableFilteredUsers.length === 0 && !searchQuery && (
          <div className="text-center py-4 text-muted-foreground">
            <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All available members are already assigned</p>
          </div>
        )}

        {/* Apply Assignment Button (only show if taskId is provided) */}
        {taskId && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleApplyAssignment}
              disabled={disabled || isAssigning}
              className="w-full"
              variant={selectedUsers.length === 0 ? "outline" : "default"}
            >
              {isAssigning ? (
                <>Applying...</>
              ) : selectedUsers.length === 0 ? (
                <>Unassign Task</>
              ) : (
                <>Assign to {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedTaskAssignment;
