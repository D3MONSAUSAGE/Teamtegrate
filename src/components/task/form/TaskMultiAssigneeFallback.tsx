
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';

interface TaskMultiAssigneeFallbackProps {
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading: boolean;
}

const TaskMultiAssigneeFallback: React.FC<TaskMultiAssigneeFallbackProps> = ({
  selectedMembers = [],
  onMembersChange,
  users = [],
  isLoading
}) => {
  const [open, setOpen] = React.useState(false);

  const safeSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers : [];
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.id && user.name) : [];
  const selectedUsers = safeUsers.filter(user => safeSelectedMembers.includes(user.id));

  const handleSelect = (userId: string) => {
    if (safeSelectedMembers.includes(userId)) {
      onMembersChange(safeSelectedMembers.filter(id => id !== userId));
    } else {
      onMembersChange([...safeSelectedMembers, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onMembersChange(safeSelectedMembers.filter(id => id !== userId));
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-between" disabled>
          Loading team members...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {safeSelectedMembers.length === 0 
              ? "Select team members..." 
              : `${safeSelectedMembers.length} member(s) selected`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2">
          <div className="max-h-60 overflow-y-auto">
            {safeUsers.length === 0 ? (
              <div className="text-sm text-gray-500 p-2">No team members found</div>
            ) : (
              safeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeSelectedMembers.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-sm">{user.name}</span>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-1">
              {user.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeUser(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskMultiAssigneeFallback;
