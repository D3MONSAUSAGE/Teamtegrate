
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Mail, Calendar, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { UserRole } from '@/types';
import WorkingRoleManagement from './WorkingRoleManagement';

interface UserCardProps {
  user: {
    id: string;
    name?: string; // Made optional to match User type
    email: string;
    role: UserRole;
    createdAt?: Date;
    avatar_url?: string;
    timezone?: string;
  };
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
  const isUpdating = updatingUserId === user.id;
  const userName = user.name || user.email.split('@')[0]; // Fallback if name is undefined
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleRoleChanged = () => {
    // Trigger a refresh of the user data
    window.location.reload();
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">
                  {userName}
                </h3>
                {isUpdating && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Mail className="h-3 w-3" />
                <span className="truncate">{user.email}</span>
              </div>
              
              {user.createdAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              
              {user.timezone && user.timezone !== 'UTC' && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {user.timezone}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <WorkingRoleManagement
              targetUser={user}
              onRoleChanged={handleRoleChanged}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditUser(user)}>
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDeleteUser(user)} 
                  className="text-red-600"
                  disabled={user.role === 'superadmin'}
                >
                  Remove User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
