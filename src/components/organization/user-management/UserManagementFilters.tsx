
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from 'lucide-react';
import { UserRole } from '@/types';

interface UserManagementFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRole: UserRole | 'all';
  setSelectedRole: (role: UserRole | 'all') => void;
  onCreateUser: () => void;
}

const UserManagementFilters: React.FC<UserManagementFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedRole,
  setSelectedRole,
  onCreateUser
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
        className="px-3 py-2 border rounded-md bg-background"
      >
        <option value="all">All Roles</option>
        <option value="superadmin">Superadmin</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="user">User</option>
      </select>

      <Button onClick={onCreateUser} className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Add User
      </Button>
    </div>
  );
};

export default UserManagementFilters;
