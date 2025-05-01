
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { List, Plus, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ProjectProgressBar from '@/components/ProjectProgressBar';
import ProjectStatusSelect from '@/components/ProjectStatusSelect';
import ProjectBudgetInfo from './ProjectBudgetInfo';

interface ProjectCardContentProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCardContent: React.FC<ProjectCardContentProps> = ({ project, onViewTasks, onCreateTask }) => {
  return (
    <CardContent className="flex-1 flex flex-col pt-0">
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {project.description || 'No description provided'}
      </p>
      
      <div className="space-y-4 mb-4">
        <ProjectProgressBar project={project} />
        
        <div className="mb-4">
          <ProjectStatusSelect project={project} />
        </div>
      </div>

      {project.budget > 0 && (
        <ProjectBudgetInfo 
          budget={project.budget} 
          budgetSpent={project.budgetSpent || 0} 
        />
      )}

      <div className="mt-2 mb-4 text-xs text-gray-500">
        {project.teamMembers && project.teamMembers.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Users className="h-3 w-3" /> 
            <span>{project.teamMembers.length} team member{project.teamMembers.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> 
          <span>Deadline: {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
        </div>
      </div>
      
      {(onViewTasks || onCreateTask) && (
        <div className="mt-auto pt-4 flex gap-2 justify-end">
          {onViewTasks && (
            <Link to={`/dashboard/projects/${project.id}/tasks`}>
              <Button variant="outline" size="sm">
                <List className="w-4 h-4 mr-1" /> Tasks
              </Button>
            </Link>
          )}
          {onCreateTask && (
            <Button size="sm" onClick={onCreateTask}>
              <Plus className="w-4 h-4 mr-1" /> Task
            </Button>
          )}
        </div>
      )}
    </CardContent>
  );
};

export default ProjectCardContent;
