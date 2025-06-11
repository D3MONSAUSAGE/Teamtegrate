
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from '@/types';
import { Users, Search, X, Plus } from 'lucide-react';

interface TaskMultiAssigneeSelectProps {
  assignedUsers: string[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  users: User[];
  isLoading?: boolean;
}

const TaskMultiAssigneeSelect: React.FC<TaskMultiAssigneeSelectProps> = ({
  assignedUsers,
  onAssign,
  onUnassign,
  users,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const name = user.name || user.email;
    return name.toLowerCase().includes(searchLower) || 
           user.email.toLowerCase().includes(searchLower);
  });

  const availableUsers = filteredUsers.filter(user => !assignedUsers.includes(user.id));
  const selectedUsers = users.filter(user => assignedUsers.includes(user.id));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignment
          </CardTitle>
          <CardDescription>Loading team members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Multi-Assignment
        </CardTitle>
        <CardDescription>
          Assign this task to multiple team members
        </CardDescription>
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
          />
        </div>

        {/* Currently Assigned */}
        {selectedUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Assigned Members ({selectedUsers.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  variant="default"
                  className="flex items-center gap-2 pr-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(user.name || user.email).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{user.name || user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onUnassign(user.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Members */}
        {availableUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Available Members</h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.name || user.email).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name || user.email}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAssign(user.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableUsers.length === 0 && searchQuery && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members found matching "{searchQuery}"</p>
          </div>
        )}

        {assignedUsers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members assigned yet</p>
            <p className="text-xs">Search and click + to assign members</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskMultiAssigneeSelect;
