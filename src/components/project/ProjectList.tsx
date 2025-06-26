
import React from 'react';
import { Project } from '@/types';
import ProjectCard from '@/components/project-card/ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onViewTasks: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
  onProjectDeleted: () => void;
  onCreateProject: () => void;
  emptyMessage: string;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onViewTasks,
  onCreateTask,
  onProjectDeleted,
  onCreateProject,
  emptyMessage
}) => {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Get started by creating your first project to organize your work.
        </p>
        <Button onClick={onCreateProject} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onViewTasks={() => onViewTasks(project.id)}
          onCreateTask={() => onCreateTask(project.id)}
          onDeleted={onProjectDeleted}
        />
      ))}
    </div>
  );
};

export default ProjectList;
