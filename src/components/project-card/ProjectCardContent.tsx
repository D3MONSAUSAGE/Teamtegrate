
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { List, Plus, Calendar, Users } from 'lucide-react';
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
        return "bg-green-500/20 text-green-700 dark:text-green-500 hover:bg-green-500/30";
      case 'In Progress':
        return "bg-blue-500/20 text-blue-700 dark:text-blue-500 hover:bg-blue-500/30";
      default: // To Do
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/30";
    }
  };

  const handleViewTasksClick = (e: React.MouseEvent) => {
    console.log('ProjectCardContent: View tasks button clicked - event:', e.type);
    e.preventDefault();
    e.stopPropagation();
    console.log('ProjectCardContent: View tasks button clicked for project:', project.id);
    
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
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {project.description || 'No description provided'}
      </p>
      
      <div className="space-y-4 mb-4">
        <ProjectProgressBar project={project} />
        
        <div className="flex justify-between items-center mb-4">
          <Badge className={`${getStatusStyle(project.status)}`}>
            {project.status}
          </Badge>
          <span className="text-xs text-gray-500">{project.tasksCount} tasks</span>
        </div>
      </div>

      {project.budget > 0 && (
        <ProjectBudgetInfo 
          budget={project.budget} 
          budgetSpent={project.budgetSpent} 
        />
      )}

      <div className="mt-2 mb-4 text-xs text-gray-500">
        {project.teamMemberIds && project.teamMemberIds.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Users className="h-3 w-3" /> 
            <span>{project.teamMemberIds.length} team member{project.teamMemberIds.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> 
          <span>Deadline: {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
        </div>
      </div>
      
      <div className="mt-auto pt-4 flex gap-2 justify-end relative z-20">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewTasksClick}
          className="pointer-events-auto"
          type="button"
          onMouseDown={(e) => {
            console.log('ProjectCardContent: View tasks button mouse down');
            e.stopPropagation();
          }}
        >
          <List className="w-4 h-4 mr-1" /> Tasks
        </Button>
        <Button 
          size="sm" 
          onClick={handleCreateTaskClick}
          className="pointer-events-auto"
          type="button"
          onMouseDown={(e) => {
            console.log('ProjectCardContent: Create task button mouse down');
            e.stopPropagation();
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Task
        </Button>
      </div>
    </CardContent>
  );
};

export default ProjectCardContent;
