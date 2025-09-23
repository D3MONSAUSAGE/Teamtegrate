import React, { useState } from 'react';
import { Crown, Shield, UserCheck, Plus, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UserCard } from './UserCard';
import { Team } from '@/types/teams';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface AdminHierarchySectionProps {
  adminUsers: OrganizationUser[];
  teams: Team[];
  searchTerm: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'superadmin':
      return <Crown className="h-4 w-4 text-amber-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'manager':
      return <UserCheck className="h-4 w-4 text-emerald-500" />;
    default:
      return null;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'superadmin':
      return 'destructive' as const; // Gold/amber appearance for superadmin
    case 'admin':
      return 'default' as const; // Blue appearance for admin
    case 'manager':
      return 'secondary' as const; // Green appearance for manager
    default:
      return 'outline' as const;
  }
};

export const AdminHierarchySection: React.FC<AdminHierarchySectionProps> = ({ 
  adminUsers, 
  teams, 
  searchTerm 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (adminUsers.length === 0 && searchTerm) {
    return null; // Don't show empty section when searching
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <CardTitle className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 transition-transform" />
                ) : (
                  <ChevronRight className="h-5 w-5 transition-transform" />
                )}
                <Crown className="h-5 w-5 text-primary" />
                Admin Hierarchy
                <Badge variant="secondary" className="ml-2">
                  {adminUsers.length} Admins
                </Badge>
              </CardTitle>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Promote User
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {adminUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No admin users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminUsers.map(admin => (
                  <AdminUserCard 
                    key={admin.id} 
                    admin={admin} 
                    teams={teams}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

interface AdminUserCardProps {
  admin: OrganizationUser;
  teams: Team[];
}

const AdminUserCard: React.FC<AdminUserCardProps> = ({ admin, teams }) => {
  const { teamMembers } = useRealTeamMembers();
  
  // Find teams where this admin is a member
  const adminTeamMemberships = teamMembers.filter(
    member => member.id === admin.id
  );

  // Find teams where this admin is the manager
  const managedTeams = teams.filter(team => team.manager_id === admin.id);

  return (
    <div className="bg-muted/30 rounded-lg p-4 border">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={admin.avatar_url} />
            <AvatarFallback>
              {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{admin.name}</h4>
              <Badge variant={getRoleBadgeVariant(admin.role)} className="text-xs">
                {getRoleIcon(admin.role)}
                <span className="ml-1 capitalize">{admin.role}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{admin.email}</p>
            
            {/* Team Information */}
            <div className="space-y-2">
              {managedTeams.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Manages:</span>
                  {managedTeams.map(team => (
                    <Badge key={team.id} variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {team.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {adminTeamMemberships.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Member of:</span>
                  {adminTeamMemberships.map(membership => (
                    <Badge key={membership.team_id} variant="secondary" className="text-xs">
                      {membership.team_name} ({membership.role})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            Add to Team
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
};