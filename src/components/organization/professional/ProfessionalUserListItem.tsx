
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Crown, 
  Shield, 
  UserCheck, 
  Users, 
  Mail, 
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ProfessionalUserListItemProps {
  user: {
    id: string;
    name?: string;
    email: string;
    role: string;
    avatar_url?: string;
    created_at?: string;
    createdAt?: Date;
  };
  onViewProfile: (userId: string) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

const ProfessionalUserListItem: React.FC<ProfessionalUserListItemProps> = ({
  user,
  onViewProfile,
  onEditUser,
  onDeleteUser
}) => {
  const { user: currentUser } = useAuth();
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-orange-600" />;
      case 'manager': return <UserCheck className="h-4 w-4 text-green-600" />;
      default: return <Users className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300';
      case 'admin': return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300';
      case 'manager': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
      default: return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300';
    }
  };

  const userName = user.name || user.email.split('@')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isCurrentUser = currentUser?.id === user.id;
  const canManage = currentUser && ['superadmin', 'admin'].includes(currentUser.role) && !isCurrentUser;
  const canViewProfile = currentUser && ['manager', 'admin', 'superadmin'].includes(currentUser.role);

  const createdDate = user.createdAt || (user.created_at ? new Date(user.created_at) : null);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarImage src={user.avatar_url} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isCurrentUser && (
                <div className="absolute -top-1 -right-1 p-1 bg-primary rounded-full">
                  <Star className="h-2 w-2 text-primary-foreground fill-current" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {userName}
                </h4>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                {createdDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      Joined {formatDistanceToNow(createdDate, { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge className={`${getRoleBadgeStyle(user.role)} border font-medium`}>
              <span className="flex items-center gap-1">
                {getRoleIcon(user.role)}
                <span className="capitalize">{user.role}</span>
              </span>
            </Badge>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="hidden sm:inline">Active</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canViewProfile && (
                  <DropdownMenuItem onClick={() => onViewProfile(user.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <>
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(user)} 
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalUserListItem;
