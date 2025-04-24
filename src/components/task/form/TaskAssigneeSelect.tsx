
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { AppUser } from '@/types';

interface TaskAssigneeSelectProps {
  selectedMember: string | undefined;
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
    <div className="space-y-2">
      <Label htmlFor="assignedTo">Assigned To</Label>
      <Select
        value={selectedMember}
        onValueChange={onAssign}
      >
        <SelectTrigger>
          <SelectValue placeholder="Assign to user (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
              <span className="text-sm">Loading users...</span>
            </div>
          ) : users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskAssigneeSelect;
