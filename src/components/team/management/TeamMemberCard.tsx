import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Shield, User, MoreVertical, MessageSquarePlus, Edit, Trash2 } from 'lucide-react';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import JobRoleBadge from '@/components/JobRoleBadge';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'manager' | 'team_leader' | 'member';
  tasksCompleted?: number;
  totalTasks?: number;
  completionRate?: number;
}

interface TeamMemberCardProps {
  member: TeamMember;
  canManage: boolean;
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemove: (memberId: string) => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  canManage,
  onRoleChange,
  onRemove
}) => {
  const { userJobRoles, primaryJobRole } = useUserJobRoles(member.id);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'team_leader': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member': return <User className="h-4 w-4 text-gray-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'manager': return 'default';
      case 'team_leader': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar_url} />
          <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{member.name}</h4>
            <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
              {getRoleIcon(member.role)}
              {member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">{member.email}</p>
          
          {/* Job roles display */}
          {userJobRoles && userJobRoles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {userJobRoles.slice(0, 3).map((userJobRole) => (
                <JobRoleBadge
                  key={userJobRole.id}
                  roleName={userJobRole.job_role?.name || 'Unknown Role'}
                  isPrimary={userJobRole.is_primary}
                  size="sm"
                  showIcon={false}
                />
              ))}
              {userJobRoles.length > 3 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  +{userJobRoles.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Performance metrics */}
          {member.completionRate !== undefined && (
            <div className="text-xs text-muted-foreground">
              Performance: {member.completionRate}% ({member.tasksCompleted}/{member.totalTasks} tasks)
            </div>
          )}
        </div>
      </div>

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRoleChange(member.id, 'manager')}>
              <Crown className="h-4 w-4 mr-2" />
              Make Manager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange(member.id, 'team_leader')}>
              <Shield className="h-4 w-4 mr-2" />
              Make Team Leader
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange(member.id, 'member')}>
              <User className="h-4 w-4 mr-2" />
              Make Member
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRemove(member.id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default TeamMemberCard;