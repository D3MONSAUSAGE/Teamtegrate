
import React from 'react';
import { 
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from 'lucide-react';
import { User, UserRole } from '@/types';
import UserTableRow from './UserTableRow';

interface UserManagementTableProps {
  users: User[];
  currentUserId?: string;
  currentUserRole?: string;
  canDeleteUser: (user: User) => boolean;
  deletingUser: string | null;
  onDeleteClick: (user: User) => void;
  onEditClick: (user: User) => void;
  onRoleChanged: () => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  currentUserId,
  currentUserRole,
  canDeleteUser,
  deletingUser,
  onDeleteClick,
  onEditClick,
  onRoleChanged
}) => {
  const sortedUsers = users.sort((a, b) => {
    const roleOrder = { 'superadmin': 4, 'admin': 3, 'manager': 2, 'user': 1 };
    return (roleOrder[b.role as UserRole] || 0) - (roleOrder[a.role as UserRole] || 0);
  });

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <UserTableRow
              key={user.id}
              user={{
                id: user.id,
                name: user.name || user.email || 'User',
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url
              }}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canDeleteUser={canDeleteUser(user)}
              isDeleting={deletingUser === user.id}
              onDeleteClick={() => onDeleteClick(user)}
              onEditClick={() => onEditClick(user)}
              onRoleChanged={onRoleChanged}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagementTable;
