
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from '@/types';
import { Users } from 'lucide-react';

interface TaskMultiAssigneeFallbackProps {
  assignedUserIds: string[];
  users: User[];
}

const TaskMultiAssigneeFallback: React.FC<TaskMultiAssigneeFallbackProps> = ({
  assignedUserIds,
  users
}) => {
  const assignedUsers = users.filter(user => assignedUserIds.includes(user.id));

  if (assignedUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignment
          </CardTitle>
          <CardDescription>No users assigned to this task</CardDescription>
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
          {assignedUsers.length} {assignedUsers.length === 1 ? 'user' : 'users'} assigned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {assignedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(user.name || user.email).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{user.name || user.email}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskMultiAssigneeFallback;
