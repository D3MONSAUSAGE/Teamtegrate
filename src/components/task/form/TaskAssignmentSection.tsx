
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Task } from '@/types';

interface TaskAssignmentSectionProps {
  register: any;
  errors: any;
  setValue: any;
  editingTask?: Task;
  teamMembers: User[];
}

export const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  register,
  errors,
  setValue,
  editingTask,
  teamMembers
}) => {
  const handleAssigneeChange = (userId: string) => {
    if (userId === "unassigned") {
      setValue("assigned_to_id", null);
      setValue("assignedToName", null);
    } else {
      const selectedMember = teamMembers.find(member => member.id === userId);
      setValue("assigned_to_id", userId);
      setValue("assignedToName", selectedMember?.name || "");
    }
  };

  return (
    <div>
      <Label htmlFor="assignee">Assigned To</Label>
      <Select 
        defaultValue={editingTask?.assigned_to_id || "unassigned"}
        onValueChange={handleAssigneeChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select assignee">
            {editingTask?.assigned_to_id ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={teamMembers.find(m => m.id === editingTask.assigned_to_id)?.avatar_url || ""} 
                    alt={editingTask.assignedToName || "User"} 
                  />
                  <AvatarFallback>
                    {(editingTask.assignedToName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{editingTask.assignedToName}</span>
              </div>
            ) : (
              "Unassigned"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-500">?</span>
              </div>
              <span>Unassigned</span>
            </div>
          </SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={member.avatar_url || ""} 
                    alt={member.name} 
                  />
                  <AvatarFallback>
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{member.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
