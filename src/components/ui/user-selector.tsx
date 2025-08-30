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
  avatar_url?: string; // Add support for avatar_url from useOrganizationUsers
}

interface UserSelectorProps {
  users?: User[];
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  maxSelection?: number;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users = [],
  selectedUserIds,
  onSelectionChange,
  maxSelection,
  placeholder = "Select team members...",
  className,
  multiple = false
}) => {
  const [open, setOpen] = useState(false);

  // Debug logging
  console.log('👥 UserSelector: Received users:', users);
  console.log('👥 UserSelector: Selected IDs:', selectedUserIds);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleUserSelect = (userId: string) => {
    console.log('👥 UserSelector: User selected:', userId);
    if (selectedUserIds.includes(userId)) {
      // Remove user
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    } else if (!maxSelection || selectedUserIds.length < maxSelection) {
      // Add user (unlimited if maxSelection is undefined)
      onSelectionChange([...selectedUserIds, userId]);
    }
    
    // Close the popover after selection if not multiple
    if (!multiple) {
      setOpen(false);
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
                <AvatarImage src={user.avatar_url || user.avatar} />
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
        <Popover open={open} onOpenChange={(newOpen) => {
          console.log('👥 Popover state changing to:', newOpen);
          setOpen(newOpen);
        }}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left font-normal"
              disabled={maxSelection ? selectedUserIds.length >= maxSelection : false}
              onClick={() => {
                console.log('👥 PopoverTrigger clicked, current open:', open);
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              {selectedUsers.length === 0 
                ? placeholder
                : maxSelection 
                  ? `${selectedUsers.length} of ${maxSelection} selected`
                  : `${selectedUsers.length} selected`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0 z-[100] pointer-events-auto bg-popover border shadow-md" 
            align="start"
            side="bottom"
            sideOffset={4}
            onOpenAutoFocus={(e) => {
              console.log('👥 PopoverContent auto focus');
              e.preventDefault();
            }}
          >
            <Command className="pointer-events-auto">
              <CommandInput 
                placeholder="Search team members..." 
                className="h-9 pointer-events-auto"
                onFocus={() => console.log('👥 CommandInput focused')}
              />
              <CommandList className="pointer-events-auto max-h-60 overflow-y-auto">
                <CommandEmpty>No team members found.</CommandEmpty>
                <CommandGroup className="pointer-events-auto">
                  {availableUsers.map(user => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => {
                        console.log('👥 CommandItem onSelect triggered for:', user.name);
                        handleUserSelect(user.id);
                      }}
                      onClick={(e) => {
                        console.log('👥 CommandItem onClick triggered for:', user.name);
                        e.preventDefault();
                        e.stopPropagation();
                        handleUserSelect(user.id);
                      }}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || user.avatar} />
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

        {selectedUserIds.length > 0 && maxSelection && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {selectedUserIds.length}/{maxSelection}
          </div>
        )}
      </div>
    </div>
  );
};