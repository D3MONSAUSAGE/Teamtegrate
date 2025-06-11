
import React from 'react';
import { User } from '@/types'; // Removed AppUser import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskAssigneeSelectProps {
  users: User[]; // Changed from AppUser to User
  selectedUser?: string;
  onUserSelect: (userId: string) => void;
  placeholder?: string;
}

const TaskAssigneeSelect: React.FC<TaskAssigneeSelectProps> = ({
  users,
  selectedUser,
  onUserSelect,
  placeholder = "Select assignee"
}) => {
  return (
    <Select value={selectedUser} onValueChange={onUserSelect}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(user.name || user.email).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{user.name || user.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TaskAssigneeSelect;
