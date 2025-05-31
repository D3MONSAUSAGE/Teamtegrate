
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, BarChart } from 'lucide-react';
import { Project } from '@/types';
import { format } from 'date-fns';

interface ProjectOverviewProps {
  project: Project;
  progress: number;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project, progress }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Timeline</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {project.start_date && project.end_date && (
              `${format(new Date(project.start_date), 'MMM d')} - ${format(new Date(project.end_date), 'MMM d')}`
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {project.team_members && project.team_members.length > 0 ? (
              `${project.team_members.length} team members`
            ) : (
              'No team members assigned'
            )}
          </p>
          <div className="mt-2">
            <Badge variant={project.status === 'Done' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress}%</div>
          <p className="text-xs text-muted-foreground">
            {project.tasks_count} total tasks
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${project.budget_spent?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            of ${project.budget?.toLocaleString() || '0'} budget
          </p>
          {project.budget && project.budget > 0 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.min((project.budget_spent || 0) / project.budget * 100, 100)}%` 
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {project.team_members ? project.team_members.length : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active members
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverview;
