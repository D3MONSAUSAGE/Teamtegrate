
import React from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Plus, Target } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectOverviewProps {
  project: Project;
  progress: number;
  todoTasksCount: number;
  inProgressTasksCount: number;
  pendingTasksCount: number;
  completedTasksCount: number;
  onCreateTask: () => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  progress,
  todoTasksCount,
  inProgressTasksCount,
  pendingTasksCount,
  completedTasksCount,
  onCreateTask
}) => {
  const totalTasks = todoTasksCount + inProgressTasksCount + pendingTasksCount + completedTasksCount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{project.title}</CardTitle>
            <CardDescription>{project.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'Done' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
            <Button onClick={onCreateTask} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Dates */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {project.start_date && project.end_date 
                ? `${format(new Date(project.start_date), 'MMM dd')} - ${format(new Date(project.end_date), 'MMM dd, yyyy')}`
                : 'No dates set'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{project.team_members?.length || 0} team members</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Task Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{todoTasksCount}</div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{inProgressTasksCount}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingTasksCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedTasksCount}</div>
            <div className="text-xs text-muted-foreground">Done</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectOverview;
