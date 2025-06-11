
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
  selectedMember?: string; // Add compatibility prop
  onUserSelect?: (userId: string) => void;
  onAssign?: (userId: string) => void; // Add compatibility prop
  users: User[];
  isLoading?: boolean;
  placeholder?: string;
}

const TaskAssigneeSelect: React.FC<TaskAssigneeSelectProps> = ({
  selectedUser = "unassigned",
  selectedMember, // Accept but use selectedUser as primary
  onUserSelect,
  onAssign, // Accept but use onUserSelect as primary
  users,
  isLoading = false,
  placeholder = "Select assignee"
}) => {
  // Use compatibility props
  const currentSelection = selectedMember || selectedUser;
  const handleSelection = onAssign || onUserSelect || (() => {});

  return (
    <div className="space-y-2">
      <Label>Assignee</Label>
      <Select value={currentSelection} onValueChange={handleSelection} disabled={isLoading}>
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
