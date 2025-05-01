
import React from 'react';
import { Label } from "@/components/ui/label";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useUsers } from '@/hooks/useUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskAssignmentSectionProps {
  register: UseFormRegister<any>;
  selectedMember: string | undefined;
  setSelectedMember: (memberId: string | undefined) => void;
  setValue: UseFormSetValue<any>;
}

export const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  register,
  selectedMember,
  setSelectedMember,
  setValue
}) => {
  const { users } = useUsers();

  const handleUserChange = (userId: string) => {
    if (userId === "unassigned") {
      setSelectedMember(undefined);
      setValue('assignedToName', '');
    } else {
      const user = users.find(u => u.id === userId);
      setSelectedMember(userId);
      setValue('assignedToName', user?.name || user?.email || '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Assign to</Label>
        <Select 
          value={selectedMember || "unassigned"} 
          onValueChange={handleUserChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(user.name?.[0] || user.email?.[0] || '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name || user.email}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">
          Once assigned, the team member will be notified about this task.
        </p>
      </div>
      
      {/* Hidden input to store the assignedToName */}
      <input 
        type="hidden" 
        {...register("assignedToName")} 
      />
    </div>
  );
};
