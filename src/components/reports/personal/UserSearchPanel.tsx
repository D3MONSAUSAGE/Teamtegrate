import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, User, ArrowLeft, UserCheck } from 'lucide-react';
import { useUsersByContext } from '@/hooks/useUsersByContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth';

interface UserSearchPanelProps {
  selectedUserId: string;
  selectedUserName: string;
  onUserSelect: (userId: string, userName: string) => void;
  onBackToPersonal: () => void;
}

export const UserSearchPanel: React.FC<UserSearchPanelProps> = ({
  selectedUserId,
  selectedUserName,
  onUserSelect,
  onBackToPersonal
}) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { users, isLoading } = useUsersByContext(currentUser?.organizationId);

  // Check if user has manager+ access
  const canSearchUsers = currentUser && hasRoleAccess(currentUser.role, 'manager');

  if (!canSearchUsers) {
    return null;
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isViewingOtherUser = selectedUserId !== currentUser?.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Team Member Search
          </CardTitle>
          {isViewingOtherUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToPersonal}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Data
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Context Display */}
        {isViewingOtherUser && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              Currently viewing: <span className="font-medium">{selectedUserName}</span>
            </span>
          </div>
        )}

        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Team Members</label>
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Team Member</label>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading team members...</div>
          ) : (
            <Select
              value={selectedUserId}
              onValueChange={(userId) => {
                const selectedUser = users.find(u => u.id === userId);
                if (selectedUser) {
                  onUserSelect(userId, selectedUser.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member" />
              </SelectTrigger>
              <SelectContent>
                {/* Current User Option */}
                {currentUser && (
                  <SelectItem value={currentUser.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Me</Badge>
                      {currentUser.name}
                    </div>
                  </SelectItem>
                )}
                
                {/* Other Users */}
                {filteredUsers
                  .filter(user => user.id !== currentUser?.id)
                  .map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{user.name}</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                
                {filteredUsers.length === 0 && searchQuery && (
                  <div className="p-2 text-sm text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm font-medium">Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => currentUser && onUserSelect(currentUser.id, currentUser.name)}
              className="flex items-center gap-1"
            >
              <User className="h-3 w-3" />
              My Data
            </Button>
            {/* Add more quick actions for common users if needed */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
