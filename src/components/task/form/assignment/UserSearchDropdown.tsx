import React, { useState } from 'react';
import { User } from '@/types';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface UserSearchDropdownProps {
  users: User[];
  onSelect: (userId: string) => void;
  assignedUsers: string[];
  isLoading?: boolean;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  users,
  onSelect,
  assignedUsers,
  isLoading = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      (user.name?.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)) &&
      !assignedUsers.includes(user.id)
    );
  }, [users, searchQuery, assignedUsers]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="w-full"
          />
          <Users className="absolute top-2.5 right-2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <ScrollArea className="h-64">
              <CommandGroup heading="Users">
                {isLoading ? (
                  <>
                    <CommandItem className="justify-center">
                      <Skeleton className="h-4 w-[80%]" />
                    </CommandItem>
                    <CommandItem className="justify-center">
                      <Skeleton className="h-4 w-[80%]" />
                    </CommandItem>
                    <CommandItem className="justify-center">
                      <Skeleton className="h-4 w-[80%]" />
                    </CommandItem>
                  </>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name || user.email}
                      onSelect={() => {
                        onSelect(user.id);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(user.name || user.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name || user.email}</span>
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <CommandEmpty>No users found.</CommandEmpty>
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSearchDropdown;
