
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, X, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';

export interface TaskMultiAssigneeSelectProps {
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  onError?: () => void;
}

const TaskMultiAssigneeSelect: React.FC<TaskMultiAssigneeSelectProps> = ({
  selectedMembers = [],
  onMembersChange,
  users = [],
  isLoading = false,
  placeholder = "Select team members...",
  emptyMessage = "No team members found",
  onError
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Ensure safe array operations
  const safeSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers : [];
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.id && user.name) : [];
  
  // Get selected users for display
  const selectedUsers = safeUsers.filter(user => safeSelectedMembers.includes(user.id));
  
  // Filter available users based on search and selection
  const availableUsers = safeUsers.filter(user => 
    !safeSelectedMembers.includes(user.id) && 
    user.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (userId: string) => {
    if (!userId || typeof onMembersChange !== 'function') return;
    
    try {
      if (safeSelectedMembers.includes(userId)) {
        onMembersChange(safeSelectedMembers.filter(id => id !== userId));
      } else {
        onMembersChange([...safeSelectedMembers, userId]);
      }
      setSearchValue("");
      setOpen(false);
    } catch (error) {
      console.error('Error selecting user:', error);
      if (onError) onError();
    }
  };

  const handleRemove = (userId: string) => {
    if (!userId || typeof onMembersChange !== 'function') return;
    
    try {
      onMembersChange(safeSelectedMembers.filter(id => id !== userId));
    } catch (error) {
      console.error('Error removing user:', error);
      if (onError) onError();
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={true}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 animate-pulse" />
            Loading team members...
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-2 hover:border-primary/40 transition-colors bg-background/50"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {safeSelectedMembers.length === 0 
                  ? placeholder 
                  : `${safeSelectedMembers.length} member${safeSelectedMembers.length !== 1 ? 's' : ''} selected`
                }
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-background/95 backdrop-blur-xl border-2" align="start">
          <Command>
            <CommandInput 
              placeholder="Search team members..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-0"
            />
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <Users className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{emptyMessage}</span>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {availableUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-green-500/20 to-blue-500/20 text-foreground border">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Check className="h-4 w-4 text-green-600" />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected Members Display */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium">
            Selected Team Members ({selectedUsers.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge 
                key={user.id} 
                variant="secondary" 
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50/50 to-blue-50/50 border border-green-200/30 hover:bg-green-50/70 transition-colors"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-green-500/20 to-blue-500/20 text-foreground">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                  onClick={() => handleRemove(user.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {safeUsers.length === 0 && !isLoading && (
        <div className="text-center py-6 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No team members available</p>
        </div>
      )}
    </div>
  );
};

export default TaskMultiAssigneeSelect;
