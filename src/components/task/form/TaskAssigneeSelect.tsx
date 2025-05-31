
import React from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { TaskFormValues, User } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from '@/hooks/useUsers';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskAssigneeSelectProps {
  selectedMember: string;
  setSelectedMember: React.Dispatch<React.SetStateAction<string>>;
  setValue: UseFormSetValue<TaskFormValues>;
}

export const TaskAssigneeSelect: React.FC<TaskAssigneeSelectProps> = ({
  selectedMember,
  setSelectedMember,
  setValue
}) => {
  const { users } = useUsers();

  const handleAssigneeChange = (userId: string) => {
    setSelectedMember(userId);
    const selectedUser = users.find((user: User) => user.id === userId);
    if (selectedUser) {
      setValue('assigned_to_id', userId);
      setValue('assignedToName', selectedUser.name);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Assign to team member</label>
      <Select value={selectedMember} onValueChange={handleAssigneeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select team member" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user: User) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={user.avatar_url || ''} 
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskAssigneeSelect;
