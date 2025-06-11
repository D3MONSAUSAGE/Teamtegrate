
import React from 'react';
import { User } from '@/types';
import { Input } from "@/components/ui/input";

interface UserSearchDropdownProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredUsers: User[];
  onSelectUser: (user: User) => void;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  searchTerm,
  setSearchTerm,
  filteredUsers,
  onSelectUser
}) => {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      
      {searchTerm && (
        <div className="max-h-48 overflow-y-auto border rounded-md">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                onClick={() => onSelectUser(user)}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            ))
          ) : (
            <div className="p-2 text-muted-foreground text-center">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchDropdown;
