
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

interface ProfessionalUserCardProps {
  user: {
    id: string;
    name?: string;
    email: string;
    role: string;
    avatar_url?: string;
    created_at?: string;
    createdAt?: Date;
  };
  onViewProfile?: (userId: string) => void;
  onEditUser?: (user: any) => void;
  onDeleteUser?: (user: any) => void;
  compact?: boolean;
}

const ProfessionalUserCard: React.FC<ProfessionalUserCardProps> = ({
  user,
  onViewProfile,
  onEditUser,
  onDeleteUser,
  compact = false
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

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'superadmin': return 'from-yellow-500/10 via-amber-500/10 to-orange-500/10';
      case 'admin': return 'from-orange-500/10 via-red-500/10 to-pink-500/10';
      case 'manager': return 'from-green-500/10 via-emerald-500/10 to-teal-500/10';
      default: return 'from-blue-500/10 via-indigo-500/10 to-purple-500/10';
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300';
      case 'admin': return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-300';
      case 'manager': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300';
      default: return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300';
    }
  };

  const userName = user.name || user.email.split('@')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isCurrentUser = currentUser?.id === user.id;
  const canManage = currentUser && ['superadmin', 'admin'].includes(currentUser.role) && !isCurrentUser;
  const canViewProfile = currentUser && ['manager', 'admin', 'superadmin'].includes(currentUser.role);

  const createdDate = user.createdAt || (user.created_at ? new Date(user.created_at) : null);

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br ${getRoleGradient(user.role)} backdrop-blur-sm border-0 shadow-lg`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/95 to-background/90" />
      
      {/* Role indicator stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getRoleGradient(user.role).replace('/10', '/50')}`} />
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                <AvatarImage src={user.avatar_url} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isCurrentUser && (
                <div className="absolute -top-1 -right-1 p-1 bg-primary rounded-full">
                  <Star className="h-3 w-3 text-primary-foreground fill-current" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                  {userName}
                </h3>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">You</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              
              {createdDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Joined {formatDistanceToNow(createdDate, { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canViewProfile && onViewProfile && (
                <DropdownMenuItem onClick={() => onViewProfile(user.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
              )}
              {canManage && onEditUser && (
                <>
                  <DropdownMenuItem onClick={() => onEditUser(user)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteUser && onDeleteUser(user)} 
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
        
        <div className="flex items-center justify-between">
          <Badge className={`${getRoleBadgeStyle(user.role)} border font-medium px-3 py-1`}>
            <span className="flex items-center gap-1">
              {getRoleIcon(user.role)}
              <span className="capitalize">{user.role}</span>
            </span>
          </Badge>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalUserCard;
