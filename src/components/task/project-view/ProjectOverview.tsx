
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, Task, User } from '@/types';
import { Calendar, Users, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';

interface ProjectOverviewProps {
  project: Project;
  tasks: Task[];
  teamMembers: User[];
  progress: number;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  tasks,
  teamMembers,
  progress
}) => {
  // Calculate project metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const todoTasks = tasks.filter(task => task.status === 'To Do').length;

  // Calculate time remaining
  const today = new Date();
  const endDate = new Date(project.endDate);
  const daysRemaining = differenceInDays(endDate, today);
  const isOverdue = isAfter(today, endDate);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  // Filter team members to only show those assigned to this project
  const assignedTeamMembers = teamMembers.filter(member => 
    project.teamMemberIds.includes(member.id)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Project Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Status</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
            <span className="text-sm font-medium">{project.status}</span>
          </div>
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Start:</span> {format(new Date(project.startDate), 'MMM d, yyyy')}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">End:</span> {format(new Date(project.endDate), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {isOverdue ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">
                    {Math.abs(daysRemaining)} days overdue
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {daysRemaining} days remaining
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <div className="flex gap-1 mt-2">
            <Badge variant="secondary" className="text-xs px-1">
              {completedTasks} Done
            </Badge>
            <Badge variant="outline" className="text-xs px-1">
              {inProgressTasks} Active
            </Badge>
            <Badge variant="outline" className="text-xs px-1">
              {todoTasks} Todo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Team Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignedTeamMembers.length}</div>
          <div className="flex -space-x-2 mt-2">
            {assignedTeamMembers.slice(0, 4).map((member) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(member.name || member.email).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {assignedTeamMembers.length > 4 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  +{assignedTeamMembers.length - 4}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverview;
