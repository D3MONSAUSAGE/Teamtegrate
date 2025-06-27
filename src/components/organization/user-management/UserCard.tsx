
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Crown, 
  Shield, 
  UserCheck, 
  Mail, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WorkingRoleManagement from './WorkingRoleManagement';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface UserCardProps {
  user: {
    id: string;
    name?: string;
    email: string;
    role: string;
    avatar_url?: string;
    created_at?: string;
  };
  updatingUserId: string | null;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
  compact?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  updatingUserId,
  onRoleChange,
  onEditUser,
  onDeleteUser,
  compact = false
}) => {
  const { user: currentUser } = useAuth();
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'manager': return <UserCheck className="h-4 w-4 text-green-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300';
      case 'admin': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300';
      case 'manager': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 dark:from-gray-800/30 dark:to-slate-800/30 dark:text-gray-300';
    }
  };

  const userName = user.name || user.email.split('@')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isCurrentUser = currentUser?.id === user.id;
  const canManage = currentUser && ['superadmin', 'admin'].includes(currentUser.role) && !isCurrentUser;

  const handleRoleChanged = () => {
    // Trigger a refresh or callback if needed
    console.log('Role changed for user:', user.id);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-all duration-200 border border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={user.avatar_url} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{userName}</h4>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <WorkingRoleManagement
                targetUser={user}
                onRoleChanged={handleRoleChanged}
              />
              
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(user)} 
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 hover:border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
            <AvatarImage src={user.avatar_url} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {userName}
                  </h3>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="h-3 w-3" />
                  <span>{user.email}</span>
                </div>
                
                {user.created_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(user)} 
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <WorkingRoleManagement
                targetUser={user}
                onRoleChanged={handleRoleChanged}
              />
              
              {updatingUserId === user.id && (
                <div className="text-xs text-muted-foreground">Updating...</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
