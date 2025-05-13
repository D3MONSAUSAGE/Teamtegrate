
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectCard from '@/components/project-card';
import { Project } from '@/types';

interface ProjectsGridProps {
  projects: Project[];
  filteredProjects: Project[];
  onViewTasks: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
  onCreateProject: () => void;
  onProjectDeleted: () => void;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  filteredProjects,
  onViewTasks,
  onCreateTask,
  onCreateProject,
  onProjectDeleted
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProjects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project}
          onViewTasks={() => onViewTasks(project.id)}
          onCreateTask={() => onCreateTask(project.id)}
          onDeleted={onProjectDeleted}
        />
      ))}
      
      {projects.length === 0 && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center border rounded-lg bg-white dark:bg-card">
          <p className="text-gray-500 mb-4">No projects found</p>
          <Button onClick={onCreateProject}>
            <Plus className="w-4 h-4 mr-2" /> Create First Project
          </Button>
        </div>
      )}
      
      {projects.length > 0 && filteredProjects.length === 0 && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center border rounded-lg bg-white dark:bg-card">
          <p className="text-gray-500">No matching projects found</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsGrid;
