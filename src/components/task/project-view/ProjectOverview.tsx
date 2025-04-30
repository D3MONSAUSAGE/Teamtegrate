
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project } from '@/types';

interface ProjectOverviewProps {
  project: Project | undefined;
  progress: number;
  todoTasksLength: number;
  inProgressTasksLength: number;
  pendingTasksLength: number;
  completedTasksLength: number;
  onCreateTask: () => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  progress,
  todoTasksLength,
  inProgressTasksLength,
  pendingTasksLength,
  completedTasksLength,
  onCreateTask
}) => {
  if (!project) {
    return (
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Tasks</h1>
        <Button onClick={onCreateTask}>Create New Task</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/dashboard/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Projects
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <Button onClick={onCreateTask}>Create New Task</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl font-bold">{progress}%</span>
              <Badge variant={progress === 100 ? "success" : "secondary"}>
                {project.status}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium">{format(new Date(project.endDate), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center justify-center p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                <span className="text-lg font-bold">{todoTasksLength}</span>
                <span className="text-xs text-muted-foreground">To Do</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                <span className="text-lg font-bold">{inProgressTasksLength}</span>
                <span className="text-xs text-muted-foreground">In Progress</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <span className="text-lg font-bold">{pendingTasksLength}</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-green-100 dark:bg-green-900/20 rounded-md">
                <span className="text-lg font-bold">{completedTasksLength}</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {project.teamMembers && project.teamMembers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.teamMembers.map((memberId) => (
                  <Avatar key={memberId} className="border">
                    <AvatarFallback>{memberId.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No team members assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverview;
