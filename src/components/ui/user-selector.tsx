import React, { useState } from 'react';
import { Check, X, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface UserSelectorProps {
  users: User[];
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  maxSelection?: number;
  placeholder?: string;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUserIds,
  onSelectionChange,
  maxSelection = 4,
  placeholder = "Select team members...",
  className
}) => {
  const [open, setOpen] = useState(false);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleUserSelect = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      // Remove user
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    } else if (selectedUserIds.length < maxSelection) {
      // Add user
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected users display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map(user => (
            <Badge 
              key={user.id} 
              variant="secondary" 
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
              <button
                onClick={() => handleRemoveUser(user.id)}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* User selector */}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left font-normal"
              disabled={selectedUserIds.length >= maxSelection}
            >
              <Users className="mr-2 h-4 w-4" />
              {selectedUsers.length === 0 
                ? placeholder
                : `${selectedUsers.length} of ${maxSelection} selected`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search team members..." 
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>No team members found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.map(user => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => handleUserSelect(user.id)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{user.name}</span>
                          {user.role && (
                            <Badge 
                              variant={getRoleBadgeVariant(user.role)} 
                              className="text-xs px-1.5 py-0"
                            >
                              {user.role}
                            </Badge>
                          )}
                        </div>
                        {user.email && (
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedUserIds.length > 0 && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {selectedUserIds.length}/{maxSelection}
          </div>
        )}
      </div>
    </div>
  );
};