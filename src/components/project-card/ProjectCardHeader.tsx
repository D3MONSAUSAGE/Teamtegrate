
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project } from '@/types';
import { Calendar, AlertTriangle, Users, Trash2, PencilLine } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import ProjectTags from './ProjectTags';

interface ProjectCardHeaderProps {
  project: Project;
  onDeleteClick: () => void;
  onEditClick: () => void;
  isDeleting: boolean;
}

const statusColors = {
  'To Do': 'bg-yellow-500/10 text-yellow-700 border-yellow-500',
  'In Progress': 'bg-blue-500/10 text-blue-700 border-blue-500',
  'Done': 'bg-green-500/10 text-green-700 border-green-500'
};

const ProjectCardHeader: React.FC<ProjectCardHeaderProps> = ({ project, onDeleteClick, onEditClick, isDeleting }) => {
  // Calculate days left or overdue
  const calculateDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(project.end_date);
    
    if (project.status === 'Done') {
      return null; // No need to show days remaining for completed projects
    }
    
    if (isAfter(today, endDate)) {
      const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return { overdue: true, days: daysOverdue };
    } else {
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { overdue: false, days: daysLeft };
    }
  };

  const timeInfo = calculateDaysRemaining();
  
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold line-clamp-1">{project.title}</h3>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {format(new Date(project.start_date), 'MMM d')} - {format(new Date(project.end_date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-blue-600 hover:text-blue-800"
            onClick={onEditClick}
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        <Badge 
          variant="outline" 
          className={`${statusColors[project.status]} text-xs`}
        >
          {project.status}
        </Badge>
        
        <Badge variant="outline" className="text-xs">
          {project.tasks_count} {project.tasks_count === 1 ? 'task' : 'tasks'}
        </Badge>
        
        {timeInfo && timeInfo.overdue && (
          <Badge variant="destructive" className="flex gap-1 items-center">
            <AlertTriangle className="h-3 w-3" /> 
            {timeInfo.days} {timeInfo.days === 1 ? 'day' : 'days'} overdue
          </Badge>
        )}
        
        {timeInfo && !timeInfo.overdue && (
          <Badge variant="secondary" className="text-xs">
            {timeInfo.days} {timeInfo.days === 1 ? 'day' : 'days'} left
          </Badge>
        )}
        
        {project.team_members && project.team_members.length > 0 && (
          <Badge variant="outline" className="flex gap-1 items-center text-xs">
            <Users className="h-3 w-3" />
            {project.team_members.length}
          </Badge>
        )}
      </div>
      
      {/* Display project tags if any */}
      {project.tags && project.tags.length > 0 && (
        <ProjectTags tags={project.tags} />
      )}
    </CardHeader>
  );
};

export default ProjectCardHeader;
