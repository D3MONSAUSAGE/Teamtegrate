
import React from 'react';
import { Button } from '@/components/ui/button';
import { Project } from '@/types';
import { format } from 'date-fns';
import { CalendarDays, Users, Calendar, Target, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectOverviewProps {
  project: Project;
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
  const totalTasks = todoTasksLength + inProgressTasksLength + pendingTasksLength + completedTasksLength;
  
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold line-clamp-2">{project.title}</h1>
            <p className="text-muted-foreground line-clamp-2">{project.description || 'No description provided'}</p>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
              </Badge>
              
              {project.teamMembers && project.teamMembers.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{project.teamMembers.length} Members</span>
                </Badge>
              )}
              
              <Badge 
                variant={project.status === 'Completed' ? 'success' : 
                         project.status === 'In Progress' ? 'default' : 'secondary'}
              >
                {project.status}
              </Badge>
              
              {project.tags && project.tags.length > 0 && project.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Button onClick={onCreateTask} className="whitespace-nowrap">
              <Plus className="mr-1 h-4 w-4" /> New Task
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm">Project Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">To Do</span>
              <span className="text-xl font-bold mt-1">{todoTasksLength}</span>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">In Progress</span>
              <span className="text-xl font-bold mt-1">{inProgressTasksLength}</span>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Pending</span>
              <span className="text-xl font-bold mt-1">{pendingTasksLength}</span>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Completed</span>
              <span className="text-xl font-bold mt-1">{completedTasksLength}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectOverview;
