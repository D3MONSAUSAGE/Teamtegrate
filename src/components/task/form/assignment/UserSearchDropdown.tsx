
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from '@/types';
import { Search, Plus } from 'lucide-react';

interface UserSearchDropdownProps {
  users: User[];
  excludeUserIds?: string[];
  onSelectUser: (user: User) => void;
  placeholder?: string;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  users,
  excludeUserIds = [],
  onSelectUser,
  placeholder = "Search for team members..."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    if (excludeUserIds.includes(user.id)) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const name = user.name || user.email;
    return name.toLowerCase().includes(searchLower) || 
           user.email.toLowerCase().includes(searchLower);
  });

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => setIsOpen(searchQuery.length > 0)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10"
        />
      </div>

      {isOpen && filteredUsers.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-2">
            {filteredUsers.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start h-auto p-2"
                onClick={() => handleSelectUser(user)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(user.name || user.email).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {isOpen && filteredUsers.length === 0 && searchQuery && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No users found matching "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSearchDropdown;
