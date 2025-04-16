
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, Task } from '@/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onViewTasks?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onViewTasks }) => {
  const { deleteProject } = useTask();
  
  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
  };
  
  const progress = calculateProgress(project.tasks);
  
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-base">{project.title}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit && onEdit(project)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewTasks && onViewTasks(project)}>
              View Tasks
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500" 
              onClick={() => deleteProject(project.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(project.startDate, 'MMM d')} - {format(project.endDate, 'MMM d')}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Users className="h-3 w-3" />
            <span>{project.tasks.filter(task => task.assignedToId).length} assigned</span>
          </div>
        </div>
        
        <div className="pt-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {project.tasks.filter(task => task.status === 'Completed').length} of {project.tasks.length} tasks
            </span>
            <Badge variant="outline">{progress}%</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
