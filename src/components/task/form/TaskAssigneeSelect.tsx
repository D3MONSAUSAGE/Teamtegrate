
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppUser } from '@/types';

export interface TaskAssigneeSelectProps {
  selectedMember: string;
  onAssign: (userId: string) => void;
  users: AppUser[];
  isLoading: boolean;
}

const TaskAssigneeSelect: React.FC<TaskAssigneeSelectProps> = ({
  selectedMember,
  onAssign,
  users,
  isLoading
}) => {
  return (
    <Select 
      value={selectedMember} 
      onValueChange={onAssign}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select team member" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TaskAssigneeSelect;
