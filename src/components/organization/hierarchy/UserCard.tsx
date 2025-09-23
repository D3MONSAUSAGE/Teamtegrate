import React from 'react';
import { Crown, Shield, User, Mail, Calendar, Settings } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useUserJobRoles } from '@/hooks/useUserJobRoles';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  showQuickActions?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'superadmin':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'manager':
      return <Shield className="h-4 w-4 text-green-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'superadmin':
      return 'default';
    case 'admin':
      return 'destructive';
    case 'manager':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  showQuickActions = true, 
  size = 'md' 
}) => {
  const { userJobRoles } = useUserJobRoles(user.id);

  const avatarSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm';
  const nameSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className={avatarSize}>
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className={`font-semibold ${nameSize} truncate`}>{user.name}</h4>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs h-5">
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role}</span>
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground mb-2">
                <Mail className="h-3 w-3" />
                <p className={`${textSize} truncate`}>{user.email}</p>
              </div>
              
              {/* Job Roles */}
              {userJobRoles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {userJobRoles.slice(0, 3).map(ujr => (
                    <Badge 
                      key={ujr.id} 
                      variant={ujr.is_primary ? "default" : "secondary"} 
                      className="text-xs h-5"
                    >
                      {ujr.job_role?.name}
                      {ujr.is_primary && <span className="ml-1">★</span>}
                    </Badge>
                  ))}
                  {userJobRoles.length > 3 && (
                    <Badge variant="outline" className="text-xs h-5">
                      +{userJobRoles.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};