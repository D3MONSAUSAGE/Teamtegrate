
import React from 'react';
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronsUpDown, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';

interface UserSearchDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  availableUsers: AppUser[];
  onSelectUser: (userId: string) => void;
  getUserInitials: (name: string) => string;
  getUserStatus: (userId: string) => string;
  getStatusColor: (status: string) => string;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  open,
  onOpenChange,
  searchTerm,
  onSearchChange,
  availableUsers,
  onSelectUser,
  getUserInitials,
  getUserStatus,
  getStatusColor
}) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-2 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Search and add team members...</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background/95 backdrop-blur-xl border-2">
        <Command>
          <CommandInput 
            placeholder="Search team members..." 
            value={searchTerm}
            onValueChange={onSearchChange}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <span>No team members found</span>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {availableUsers.map((user) => {
              const status = getUserStatus(user.id);
              return (
                <CommandItem
                  key={user.id}
                  onSelect={() => onSelectUser(user.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                      getStatusColor(status)
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{status}</div>
                  </div>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSearchDropdown;
