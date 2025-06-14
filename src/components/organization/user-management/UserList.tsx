
import React from 'react';
import { Users } from 'lucide-react';
import UserCard from './UserCard';
import { UserRole } from '@/types';

interface UserListProps {
  users: any[];
  updatingUserId: string | null;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  updatingUserId,
  onRoleChange,
  onEditUser,
  onDeleteUser
}) => {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          updatingUserId={updatingUserId}
          onRoleChange={onRoleChange}
          onEditUser={onEditUser}
          onDeleteUser={onDeleteUser}
        />
      ))}
      
      {users.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserList;
