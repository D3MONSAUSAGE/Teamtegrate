
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';

export interface TaskMultiAssigneeSelectProps {
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading: boolean;
}

const TaskMultiAssigneeSelect: React.FC<TaskMultiAssigneeSelectProps> = ({
  selectedMembers = [],
  onMembersChange,
  users = [],
  isLoading
}) => {
  const [open, setOpen] = React.useState(false);

  // Ensure all props are safe to use
  const safeSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers : [];
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.id && user.name) : [];
  const safeOnMembersChange = typeof onMembersChange === 'function' ? onMembersChange : () => {};
  
  const selectedUsers = safeUsers.filter(user => safeSelectedMembers.includes(user.id));

  const handleSelect = (userId: string) => {
    if (!userId || typeof userId !== 'string') return;
    
    if (safeSelectedMembers.includes(userId)) {
      safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
    } else {
      safeOnMembersChange([...safeSelectedMembers, userId]);
    }
  };

  const removeUser = (userId: string) => {
    if (!userId || typeof userId !== 'string') return;
    safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
  };

  // Don't render the Command component if users is not properly loaded
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={true}
        >
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
            disabled={isLoading}
          >
            {safeSelectedMembers.length === 0 
              ? "Select team members..." 
              : `${safeSelectedMembers.length} member(s) selected`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search team members..." />
            <CommandEmpty>No team members found.</CommandEmpty>
            <CommandGroup>
              {safeUsers.length > 0 ? (
                safeUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect(user.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        safeSelectedMembers.includes(user.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {user.name}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>
                  No team members available
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
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

export default TaskMultiAssigneeSelect;
