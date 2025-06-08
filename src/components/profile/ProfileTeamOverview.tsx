
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Crown, FolderKanban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useProjects } from '@/hooks/useProjects';

const ProfileTeamOverview = () => {
  const { user } = useAuth();
  const { teamMembersPerformance, managerPerformance } = useTeamMembers();
  const { projects } = useProjects();

  if (!user) return null;

  // Get user's projects
  const userProjects = projects.filter(project => 
    project.managerId === user.id || 
    project.teamMembers?.includes(user.id)
  ).slice(0, 3); // Show only first 3 projects

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Team Members (if user is a manager) */}
      {user.role === 'manager' && teamMembersPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Team ({teamMembersPerformance.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembersPerformance.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.completionRate >= 80 ? "default" : "secondary"}>
                    {member.completionRate}%
                  </Badge>
                </div>
              ))}
              {teamMembersPerformance.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{teamMembersPerformance.length - 4} more team members
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manager Performance (if user is not a manager) */}
      {user.role !== 'manager' && managerPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Your Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {managerPerformance.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{managerPerformance.name}</p>
                  <p className="text-sm text-muted-foreground">{managerPerformance.email}</p>
                  <Badge variant="outline" className="text-xs mt-1">Manager</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{managerPerformance.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Active Projects ({userProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userProjects.length > 0 ? (
              userProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.managerId === user.id ? 'Managing' : 'Team Member'}
                    </p>
                  </div>
                  <Badge variant={
                    project.status === 'Completed' ? 'default' : 
                    project.status === 'In Progress' ? 'secondary' : 'outline'
                  }>
                    {project.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active projects
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTeamOverview;
