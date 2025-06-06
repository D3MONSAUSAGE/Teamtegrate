
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
  selectedMembers,
  onMembersChange,
  users,
  isLoading
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedUsers = users.filter(user => selectedMembers.includes(user.id));

  const handleSelect = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      onMembersChange(selectedMembers.filter(id => id !== userId));
    } else {
      onMembersChange([...selectedMembers, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onMembersChange(selectedMembers.filter(id => id !== userId));
  };

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
            {selectedMembers.length === 0 
              ? "Select team members..." 
              : `${selectedMembers.length} member(s) selected`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search team members..." />
            <CommandEmpty>No team members found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMembers.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.name}
                </CommandItem>
              ))}
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
