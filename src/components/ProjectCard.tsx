
import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { format } from 'date-fns';
import { Calendar, List, Plus } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewTasks, onCreateTask }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {format(project.startDate, 'MMM d')} - {format(project.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {project.description || 'No description provided'}
        </p>
        
        {(onViewTasks || onCreateTask) && (
          <div className="mt-auto pt-4 flex gap-2 justify-end">
            {onViewTasks && (
              <Button variant="outline" size="sm" onClick={onViewTasks}>
                <List className="w-4 h-4 mr-1" /> Tasks
              </Button>
            )}
            {onCreateTask && (
              <Button size="sm" onClick={onCreateTask}>
                <Plus className="w-4 h-4 mr-1" /> Task
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
