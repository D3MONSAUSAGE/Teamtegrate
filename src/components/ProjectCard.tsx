
import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Project } from '@/types';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card>
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
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2">
          {project.description || 'No description provided'}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
