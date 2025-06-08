
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Loader2, Star, Shield, Crown, User } from 'lucide-react';
import { UserRole, getRoleDisplayName } from '@/types';
import RoleManagement from './RoleManagement';

interface UserTableRowProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  currentUserId?: string;
  canDeleteUser: boolean;
  isDeleting: boolean;
  onDeleteClick: () => void;
  onRoleChanged: () => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  currentUserId,
  canDeleteUser,
  isDeleting,
  onDeleteClick,
  onRoleChanged
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Star className="h-4 w-4 text-purple-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'manager':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'default';
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            {user.id === currentUserId && (
              <div className="text-xs text-muted-foreground">(You)</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
          {getRoleIcon(user.role)}
          {getRoleDisplayName(user.role as UserRole)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.email}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <RoleManagement 
            targetUser={user} 
            onRoleChanged={onRoleChanged}
          />
          {canDeleteUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteClick}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
