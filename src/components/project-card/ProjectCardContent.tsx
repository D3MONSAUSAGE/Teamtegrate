
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { FolderOpen, Plus, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import ProjectProgressBar from '@/components/ProjectProgressBar';
import ProjectBudgetInfo from './ProjectBudgetInfo';
import { Badge } from "@/components/ui/badge";

interface ProjectCardContentProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCardContent: React.FC<ProjectCardContentProps> = ({ project, onViewTasks, onCreateTask }) => {
  console.log('ProjectCardContent: Rendering for project:', project.id, 'with handlers:', {
    hasOnViewTasks: !!onViewTasks,
    hasOnCreateTask: !!onCreateTask
  });

  // Get status style for the badge
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Completed':
        return "bg-green-500/20 text-green-700 dark:text-green-500 hover:bg-green-500/30 border border-green-500/30";
      case 'In Progress':
        return "bg-blue-500/20 text-blue-700 dark:text-blue-500 hover:bg-blue-500/30 border border-blue-500/30";
      default: // To Do
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/30 border border-yellow-500/30";
    }
  };

  const handleOpenProjectClick = (e: React.MouseEvent) => {
    console.log('ProjectCardContent: Open project button clicked - event:', e.type);
    e.preventDefault();
    e.stopPropagation();
    console.log('ProjectCardContent: Open project button clicked for project:', project.id);
    
    if (onViewTasks) {
      console.log('ProjectCardContent: Calling onViewTasks handler');
      try {
        onViewTasks();
        console.log('ProjectCardContent: onViewTasks handler completed successfully');
      } catch (error) {
        console.error('ProjectCardContent: Error in onViewTasks handler:', error);
      }
    } else {
      console.warn('ProjectCardContent: onViewTasks handler not provided');
    }
  };

  const handleCreateTaskClick = (e: React.MouseEvent) => {
    console.log('ProjectCardContent: Create task button clicked - event:', e.type);
    e.preventDefault();
    e.stopPropagation();
    console.log('ProjectCardContent: Create task button clicked for project:', project.id);
    
    if (onCreateTask) {
      console.log('ProjectCardContent: Calling onCreateTask handler');
      try {
        onCreateTask();
        console.log('ProjectCardContent: onCreateTask handler completed successfully');
      } catch (error) {
        console.error('ProjectCardContent: Error in onCreateTask handler:', error);
      }
    } else {
      console.warn('ProjectCardContent: onCreateTask handler not provided');
    }
  };

  return (
    <CardContent className="flex-1 flex flex-col pt-0">
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
        {project.description || 'No description provided'}
      </p>
      
      <div className="space-y-4 mb-4">
        <ProjectProgressBar project={project} />
        
        <div className="flex justify-between items-center mb-4">
          <Badge className={`${getStatusStyle(project.status)} font-semibold px-3 py-1`}>
            {project.status}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            <span className="font-medium">{project.tasksCount}</span>
            <span>task{project.tasksCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {project.budget > 0 && (
        <div className="mb-4">
          <ProjectBudgetInfo 
            budget={project.budget} 
            budgetSpent={project.budgetSpent} 
          />
        </div>
      )}

      <div className="mt-2 mb-4 space-y-2">
        {project.teamMemberIds && project.teamMemberIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-full">
              <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" /> 
              <span className="font-medium">{project.teamMemberIds.length} member{project.teamMemberIds.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full">
            <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" /> 
            <span className="font-medium">{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 flex gap-3 justify-end relative z-20">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleOpenProjectClick}
          className="pointer-events-auto flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200"
          type="button"
          onMouseDown={(e) => {
            console.log('ProjectCardContent: Open project button mouse down');
            e.stopPropagation();
          }}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          <span className="font-medium">Open Project</span>
        </Button>
        <Button 
          size="sm" 
          onClick={handleCreateTaskClick}
          className="pointer-events-auto hover:scale-105 transition-transform duration-200"
          type="button"
          onMouseDown={(e) => {
            console.log('ProjectCardContent: Create task button mouse down');
            e.stopPropagation();
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> 
          <span className="hidden sm:inline">Task</span>
        </Button>
      </div>
    </CardContent>
  );
};

export default ProjectCardContent;
