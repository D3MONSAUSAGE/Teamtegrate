
import React from 'react';
import { User } from '@/types';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskAssigneeSelectProps {
  selectedUser?: string;
  onUserSelect: (userId: string) => void;
  users: User[];
  placeholder?: string;
}

const TaskAssigneeSelect: React.FC<TaskAssigneeSelectProps> = ({
  selectedUser = "unassigned",
  onUserSelect,
  users,
  placeholder = "Select assignee"
}) => {
  return (
    <div className="space-y-2">
      <Label>Assignee</Label>
      <Select value={selectedUser} onValueChange={onUserSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name || user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskAssigneeSelect;
