
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FolderKanban, Calendar } from 'lucide-react';
import { Project } from '@/types';
import { format } from 'date-fns';

interface ProfileTeamOverviewProps {
  projects: Project[];
}

const ProfileTeamOverview: React.FC<ProfileTeamOverviewProps> = ({ projects }) => {
  // Calculate team stats
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  
  // Get unique team members across all projects
  const allTeamMembers = new Set<string>();
  projects.forEach(project => {
    project.teamMemberIds.forEach(memberId => {
      allTeamMembers.add(memberId);
    });
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {activeProjects} Active
            </Badge>
            <Badge variant="outline" className="text-xs">
              {completedProjects} Completed
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{allTeamMembers.size}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Across all projects
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {projects.length > 0 ? (
              <>
                <div className="font-medium">
                  {projects[0].title}
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {format(projects[0].updatedAt, 'MMM d, yyyy')}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTeamOverview;
