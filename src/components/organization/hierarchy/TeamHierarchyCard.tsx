import React, { useState } from 'react';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Crown, 
  Shield, 
  User, 
  Settings, 
  UserPlus,
  Plus
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UserCard } from './UserCard';
import { Team } from '@/types/teams';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface TeamHierarchyCardProps {
  team: Team;
  allUsers: OrganizationUser[];
}

const getTeamRoleIcon = (role: string) => {
  switch (role) {
    case 'manager':
      return <Crown className="h-3 w-3 text-yellow-500" />;
    case 'admin':
      return <Shield className="h-3 w-3 text-blue-500" />;
    case 'member':
      return <User className="h-3 w-3 text-green-500" />;
    default:
      return <User className="h-3 w-3 text-gray-500" />;
  }
};

const getTeamRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'manager':
      return 'default';
    case 'admin':
      return 'destructive';
    case 'member':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const TeamHierarchyCard: React.FC<TeamHierarchyCardProps> = ({ team, allUsers }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { teamMembers, isLoading } = useRealTeamMembers(team.id);

  // Find team manager from users
  const teamManager = allUsers.find(user => user.id === team.manager_id);

  return (
    <Card className="border">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Team Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{team.member_count} members</span>
                  </div>
                  {teamManager && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Manager:</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={teamManager.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {teamManager.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{teamManager.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="ml-7 border-l-2 border-muted pl-4 space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-muted rounded p-3 h-16" />
                  ))}
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">No team members yet</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Members
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <TeamMemberCard key={member.id} member={member} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'member' | 'admin';
    systemRole: string;
    avatar_url?: string;
    joined_at: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  const { userJobRoles } = useUserJobRoles(member.id);

  return (
    <div className="bg-card rounded-lg border p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.avatar_url} />
            <AvatarFallback className="text-xs">
              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-medium text-sm">{member.name}</h5>
              <Badge variant={getTeamRoleBadgeVariant(member.role)} className="text-xs h-5">
                {getTeamRoleIcon(member.role)}
                <span className="ml-1 capitalize">{member.role}</span>
              </Badge>
              <Badge variant="outline" className="text-xs h-5 capitalize">
                {member.systemRole}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{member.email}</p>
            
            {/* Job Roles */}
            {userJobRoles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {userJobRoles.slice(0, 2).map(ujr => (
                  <Badge key={ujr.id} variant="secondary" className="text-xs h-4 px-2">
                    {ujr.job_role?.name}
                  </Badge>
                ))}
                {userJobRoles.length > 2 && (
                  <Badge variant="outline" className="text-xs h-4 px-2">
                    +{userJobRoles.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Performance Indicators */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="text-right">
            <p className="font-medium">{member.completionRate}%</p>
            <p>completion</p>
          </div>
          <div className="text-right">
            <p className="font-medium">{member.totalTasks}</p>
            <p>tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
};