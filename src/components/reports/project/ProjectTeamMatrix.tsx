import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { Project } from '@/types';
import { Users, Briefcase } from 'lucide-react';

interface ProjectTeamMatrixProps {
  projects: Project[];
}

export const ProjectTeamMatrix: React.FC<ProjectTeamMatrixProps> = ({ projects }) => {
  const { users, isLoading } = useOrganizationUsers();

  const projectTeamMatrix = React.useMemo(() => {
    if (!users || !projects) return [];

    return users.map(user => {
      const userProjects = projects.filter(project => 
        project.teamMemberIds?.includes(user.id) ||
        project.teamMembers?.includes(user.id) ||
        project.managerId === user.id
      );

      return {
        user,
        projects: userProjects,
        projectCount: userProjects.length,
        roles: userProjects.map(project => ({
          projectId: project.id,
          projectTitle: project.title,
          isManager: project.managerId === user.id
        }))
      };
    });
  }, [users, projects]);

  const getProjectTypeColor = (project: Project) => {
    switch (project.status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'To Do': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Team-Project Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading team-project assignments...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Team-Project Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projectTeamMatrix.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No team members found
          </div>
        ) : (
          <div className="space-y-4">
            {projectTeamMatrix.map(member => (
              <div key={member.user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{member.user.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{member.user.role}</span>
                        <span>•</span>
                        <span>{member.user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users size={12} />
                      {member.projectCount} projects
                    </Badge>
                  </div>
                </div>

                {member.projects.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    Not assigned to any projects
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {member.projects.map(project => {
                      const role = member.roles.find(r => r.projectId === project.id);
                      return (
                        <div
                          key={project.id}
                          className={`p-3 rounded-lg border ${getProjectTypeColor(project)}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-sm truncate" title={project.title}>
                              {project.title}
                            </h5>
                            {role?.isManager && (
                              <Badge variant="default" className="text-xs">
                                Manager
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span>{project.status}</span>
                            <span>{project.tasksCount || 0} tasks</span>
                          </div>
                          {project.endDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(project.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};