import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from '@/types';
import { Users, X, Plus } from 'lucide-react';

interface TaskAssignmentSectionEnhancedProps {
  assignedUsers: string[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  users: User[];
  isLoading?: boolean;
}

const TaskAssignmentSectionEnhanced: React.FC<TaskAssignmentSectionEnhancedProps> = ({
  assignedUsers,
  onAssign,
  onUnassign,
  users,
  isLoading = false
}) => {
  const availableUsers = users.filter(user => !assignedUsers.includes(user.id));
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
          Assignment
        </CardTitle>
        <CardDescription>
          Assign this task to one or more team members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently Assigned */}
        {selectedUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Assigned Members</h4>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  variant="secondary"
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
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted cursor-pointer"
                  onClick={() => onAssign(user.id)}
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {assignedUsers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members assigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAssignmentSectionEnhanced;
