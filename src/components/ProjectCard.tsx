
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { fetchProjectTeamMembers } from '@/contexts/task/operations';
import ProjectCardHeader from './project/ProjectCardHeader';
import ProjectCardContent from './project/ProjectCardContent';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onViewTasks?: (project: Project) => void;
  onCreateTask?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onViewTasks, 
  onCreateTask 
}) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadTeamMembers = async () => {
      setIsLoading(true);
      if (project?.id) {
        try {
          const members = await fetchProjectTeamMembers(project.id);
          setTeamMembers(members);
        } catch (error) {
          console.error("Error loading team members:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    loadTeamMembers();
  }, [project?.id]);

  const isOverdue = project?.endDate && new Date(project.endDate) < new Date();
  const isCompletedProject = !!project?.is_completed;
  
  return (
    <Card className={cn(
      'border-l-4',
      isCompletedProject 
        ? 'border-l-green-500 bg-green-50/30 dark:bg-green-900/10'
        : isOverdue 
          ? 'border-l-red-500 bg-red-50/30 dark:bg-red-900/10'
          : 'border-l-blue-500',
      'hover:shadow-md transition-all duration-200'
    )}>
      <ProjectCardHeader 
        project={project}
        onEdit={() => onEdit?.(project)}
        onViewTasks={() => onViewTasks?.(project)}
        onCreateTask={() => onCreateTask?.(project)}
      />
      <ProjectCardContent 
        project={project}
        teamMembers={teamMembers}
        isLoading={isLoading}
        onViewTasks={() => onViewTasks?.(project)}
      />
    </Card>
  );
};

export default ProjectCard;
