import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TeamMemberMiniCardProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'member';
    avatar_url?: string;
  };
  className?: string;
}

const TeamMemberMiniCard: React.FC<TeamMemberMiniCardProps> = ({ member, className }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager':
        return 'Manager';
      default:
        return 'Member';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 p-2 bg-card border rounded-lg hover:bg-accent/50 transition-colors min-w-0 flex-shrink-0",
            className
          )}>
            <Avatar className="h-7 w-7">
              <AvatarImage src={member.avatar_url} alt={member.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <Badge 
                variant={getRoleBadgeVariant(member.role)} 
                className="text-xs h-4 px-1.5"
              >
                {getRoleLabel(member.role)}
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{member.name}</p>
            <p className="text-muted-foreground">{member.email}</p>
            <p className="text-muted-foreground capitalize">{getRoleLabel(member.role)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TeamMemberMiniCard;