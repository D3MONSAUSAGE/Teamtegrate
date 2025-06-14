
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from '@/types';
import { format } from 'date-fns';
import { getRoleIcon, getRoleBadgeVariant } from '../utils/roleUtils';

interface UserCardProps {
  user: any;
  updatingUserId: string | null;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  updatingUserId,
  onRoleChange,
  onEditUser,
  onDeleteUser
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {user.name.substring(0, 1).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{user.name}</h3>
              <div className="flex items-center gap-1">
                {getRoleIcon(user.role as UserRole)}
                <Badge variant={getRoleBadgeVariant(user.role as UserRole)} className="text-xs">
                  {user.role}
                </Badge>
                {user.role === 'superadmin' && (
                  <Badge variant="outline" className="text-xs text-yellow-600">
                    Only One Allowed
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="truncate">{user.email}</span>
              <span>{user.assigned_tasks_count || 0} tasks</span>
              <span>Joined {format(new Date(user.created_at), 'MMM yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Role Actions */}
        <div className="flex items-center gap-1 ml-2">
          {/* Quick Role Change Buttons */}
          {user.role !== 'superadmin' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRoleChange(user.id, 
                user.role === 'admin' ? 'superadmin' : 
                user.role === 'manager' ? 'admin' : 'manager'
              )}
              className="h-8 w-8 p-0"
              disabled={updatingUserId === user.id}
              title={user.role === 'admin' ? 'Promote to Superadmin (will transfer role)' : 'Promote'}
            >
              {updatingUserId === user.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowUp className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {user.role !== 'user' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRoleChange(user.id,
                user.role === 'superadmin' ? 'admin' : 
                user.role === 'admin' ? 'manager' : 'user'
              )}
              className="h-8 w-8 p-0"
              disabled={updatingUserId === user.id}
              title="Demote"
            >
              {updatingUserId === user.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-md">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => onEditUser(user)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onDeleteUser(user)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default UserCard;
