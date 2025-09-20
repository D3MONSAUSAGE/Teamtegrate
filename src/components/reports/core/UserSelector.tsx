import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsersByContext } from '@/hooks/useUsersByContext';
import { useAuth } from '@/contexts/AuthContext';

interface UserSelectorProps {
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onUserChange
}) => {
  const { user: currentUser } = useAuth();
  const { users, isLoading } = useUsersByContext(currentUser?.organizationId);

  if (isLoading) {
    return (
      <div className="w-full max-w-xs">
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <Select 
        value={selectedUserId || 'all'} 
        onValueChange={(value) => onUserChange(value === 'all' ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select user..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};