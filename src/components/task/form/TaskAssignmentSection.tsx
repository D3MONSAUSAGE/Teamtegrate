
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

export interface TaskAssignmentSectionProps {
  selectedUser?: string;
  selectedMember?: string; // Add compatibility prop
  onAssign: (userId: string) => void;
  users: User[];
  isLoading: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedUser = "unassigned",
  selectedMember, // Accept but use selectedUser as primary
  onAssign,
  users,
  isLoading
}) => {
  // Use selectedMember if provided, otherwise use selectedUser
  const currentSelection = selectedMember || selectedUser;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Assign Task</Label>
        <Select value={currentSelection} onValueChange={onAssign} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
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
    </div>
  );
};

export default TaskAssignmentSection;
