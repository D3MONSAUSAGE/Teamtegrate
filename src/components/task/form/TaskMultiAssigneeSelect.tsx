
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';

export interface TaskMultiAssigneeSelectProps {
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading: boolean;
  onError?: () => void;
}

const TaskMultiAssigneeSelect: React.FC<TaskMultiAssigneeSelectProps> = ({
  selectedMembers = [],
  onMembersChange,
  users = [],
  isLoading,
  onError
}) => {
  const [open, setOpen] = React.useState(false);

  console.log('TaskMultiAssigneeSelect render:', { 
    isLoading, 
    usersLength: users?.length, 
    selectedMembersLength: selectedMembers?.length,
    users: users 
  });

  // Ensure all props are safe to use with proper defaults
  const safeSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers : [];
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.id && user.name) : [];
  const safeOnMembersChange = typeof onMembersChange === 'function' ? onMembersChange : () => {};
  
  const selectedUsers = safeUsers.filter(user => safeSelectedMembers.includes(user.id));

  const handleSelect = (userId: string) => {
    console.log('TaskMultiAssigneeSelect - handleSelect called with:', userId);
    if (!userId || typeof userId !== 'string') return;
    
    try {
      if (safeSelectedMembers.includes(userId)) {
        safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
      } else {
        safeOnMembersChange([...safeSelectedMembers, userId]);
      }
    } catch (error) {
      console.error('Error in handleSelect:', error);
      onError?.();
    }
  };

  const removeUser = (userId: string) => {
    console.log('TaskMultiAssigneeSelect - removeUser called with:', userId);
    if (!userId || typeof userId !== 'string') return;
    
    try {
      safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
    } catch (error) {
      console.error('Error in removeUser:', error);
      onError?.();
    }
  };

  // Show loading state
  if (isLoading) {
    console.log('TaskMultiAssigneeSelect - Showing loading state');
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={true}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            Loading team members...
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  // Enhanced validation - wait until users is properly loaded
  if (!Array.isArray(users) || users.length === 0 || !users.every(user => user && user.id && user.name)) {
    console.log('TaskMultiAssigneeSelect - Data not ready, showing fallback');
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={true}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            No team members available
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  console.log('TaskMultiAssigneeSelect - Rendering full component with Command');

  try {
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
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <span>No team members found</span>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {safeUsers.map((user) => (
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
  } catch (error) {
    console.error('Error rendering TaskMultiAssigneeSelect:', error);
    onError?.();
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={true}
        >
          Error loading component
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }
};

export default TaskMultiAssigneeSelect;
