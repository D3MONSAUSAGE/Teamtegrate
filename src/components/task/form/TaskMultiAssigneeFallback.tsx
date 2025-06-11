import React from 'react';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface TaskMultiAssigneeFallbackProps {
  assignedUsers: string[];
  onUnassign: (userId: string) => void;
  users: User[];
  isLoading?: boolean;
}

const TaskMultiAssigneeFallback: React.FC<TaskMultiAssigneeFallbackProps> = ({
  assignedUsers,
  onUnassign,
  users,
  isLoading = false
}) => {
  const assignedUsersData = users.filter(user => assignedUsers.includes(user.id));

  return (
    <div className="border rounded-md p-2 bg-secondary text-secondary-foreground">
      <ScrollArea className="h-24 w-full rounded-md">
        <div className="flex flex-wrap gap-2 p-2">
          {isLoading ? (
            <div>Loading assignees...</div>
          ) : assignedUsersData.length > 0 ? (
            assignedUsersData.map((user) => (
              <div key={user.id} className="flex items-center space-x-2 border rounded-full px-3 py-1 text-sm">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                  <AvatarFallback>{(user.name || user.email).substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{user.name || user.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUnassign(user.id)}
                  className="hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div>No assignees selected.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskMultiAssigneeFallback;
