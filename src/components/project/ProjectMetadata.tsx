
import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Task, ProjectTask } from '@/types';

interface ProjectMetadataProps {
  startDate: Date;
  endDate: Date;
  tasks: Task[] | ProjectTask[];
}

const ProjectMetadata: React.FC<ProjectMetadataProps> = ({ startDate, endDate, tasks }) => {
  return (
    <div className="flex flex-wrap items-center justify-between pt-1 md:pt-2 gap-y-1">
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Calendar className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d')}
        </span>
      </div>
      
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Users className="h-3 w-3 flex-shrink-0" />
        <span>{tasks.filter(task => task.assignedToId).length} assigned</span>
      </div>
    </div>
  );
};

export default ProjectMetadata;
