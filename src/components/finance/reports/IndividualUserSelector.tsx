import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsersByContext } from '@/hooks/useUsersByContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Users } from 'lucide-react';

interface IndividualUserSelectorProps {
  selectedUserId: string | null;
  selectedTeamId: string | null;
  onUserChange: (userId: string | null) => void;
}

export const IndividualUserSelector: React.FC<IndividualUserSelectorProps> = ({
  selectedUserId,
  selectedTeamId,
  onUserChange
}) => {
  const { user: currentUser } = useAuth();
  const { users, isLoading } = useUsersByContext(currentUser?.organizationId, selectedTeamId);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="min-h-[44px]">
          <SelectValue placeholder="Loading users..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={selectedUserId || "all"}
      onValueChange={(value) => onUserChange(value === "all" ? null : value)}
    >
      <SelectTrigger className="min-h-[44px] w-full">
        <SelectValue placeholder="All users">
          <div className="flex items-center gap-2">
            {selectedUserId ? (
              <>
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{users.find(u => u.id === selectedUserId)?.name || 'Selected User'}</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>All users</span>
              </>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="all" className="min-h-[44px]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>All users</span>
          </div>
        </SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id} className="min-h-[44px]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground">({user.role})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};