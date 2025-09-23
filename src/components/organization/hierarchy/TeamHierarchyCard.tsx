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
import { TeamUserManagementModal } from './TeamUserManagementModal';

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
      return <Crown className="h-3 w-3 text-amber-500" />;
    case 'admin':
      return <Shield className="h-3 w-3 text-blue-500" />;
    case 'member':
      return <User className="h-3 w-3 text-emerald-500" />;
    default:
      return <User className="h-3 w-3 text-muted-foreground" />;
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const { teamMembers, isLoading } = useRealTeamMembers(team.id);

  // Find team managers from team_memberships (not from teams.manager_id)
  const teamManagers = teamMembers.filter(member => member.role === 'manager');

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
                  {teamManagers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Manager:</span>
                      {teamManagers.length === 1 ? (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={teamManagers[0].avatar_url} />
                            <AvatarFallback className="text-xs">
                              {teamManagers[0].name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{teamManagers[0].name}</span>
                        </div>
                      ) : (
                        <span className="font-medium">{teamManagers.length} managers</span>
                      )}
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
                  {/* Sort team members: managers first, then admin, then members */}
                  {teamMembers
                    .sort((a, b) => {
                      const roleOrder = { manager: 3, admin: 2, member: 1 };
                      const roleComparison = (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
                      if (roleComparison !== 0) return roleComparison;
                      return a.name.localeCompare(b.name);
                    })
                     .map(member => (
                       <TeamMemberCard 
                         key={member.id} 
                         member={member} 
                         onClick={() => {
                           setSelectedUser(member);
                           setIsUserModalOpen(true);
                         }}
                       />
                     ))
                  }
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      {/* User Management Modal */}
      <TeamUserManagementModal
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        user={selectedUser}
        allTeamMemberships={selectedUser ? teamMembers
          .filter(m => m.id === selectedUser.id)
          .map(m => ({
            team_id: m.team_id,
            team_name: m.team_name,
            role: m.role
          })) : []}
      />
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
  onClick?: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, onClick }) => {
  const { userJobRoles } = useUserJobRoles(member.id);

  return (
    <div 
      className="bg-card rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer hover:bg-muted/30" 
      onClick={onClick}
    >
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