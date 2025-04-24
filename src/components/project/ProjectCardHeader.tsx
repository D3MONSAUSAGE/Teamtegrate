
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from 'lucide-react';
import { Project } from '@/types';
import ProjectCardActions from './ProjectCardActions';

interface ProjectCardHeaderProps {
  project: Project;
  onEdit?: () => void;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCardHeader: React.FC<ProjectCardHeaderProps> = ({
  project,
  onEdit,
  onViewTasks,
  onCreateTask,
}) => {
  const isOverdue = project?.endDate && new Date(project.endDate) < new Date();
  const isCompletedProject = !!project?.is_completed;

  return (
    <CardHeader className="pb-1 md:pb-2 flex flex-row justify-between items-start gap-2 pt-3 px-3">
      <div className="min-w-0 flex flex-col gap-1">
        <CardTitle className="text-sm md:text-base text-ellipsis overflow-hidden whitespace-nowrap">
          {project.title}
        </CardTitle>
        <div className="flex flex-wrap gap-1 mt-1">
          {isCompletedProject && (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              <CheckCircle className="h-3 w-3" /> Completed
            </Badge>
          )}
          {isOverdue && !isCompletedProject && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </div>
      </div>
      <ProjectCardActions 
        project={project}
        onEdit={onEdit}
        onViewTasks={onViewTasks}
        onCreateTask={onCreateTask}
      />
    </CardHeader>
  );
};

export default ProjectCardHeader;
