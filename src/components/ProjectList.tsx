
import React from 'react';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  searchQuery: string;
  onEditProject: (project: Project) => void;
  onViewTasks: (project: Project) => void;
  onCreateProject: () => void;
  onCreateTask: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  searchQuery,
  onEditProject,
  onViewTasks,
  onCreateProject,
  onCreateTask,
}) => {
  // Filter projects based on search query if needed
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border text-center">
        <p className="text-gray-500">
          {searchQuery ? 'No projects found matching your search' : 'No projects created yet'}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={onCreateProject}
        >
          <Plus className="h-4 w-4 mr-2" /> Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProjects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onEdit={onEditProject} 
          onViewTasks={() => onViewTasks(project)}
          onCreateTask={() => onCreateTask(project)}
        />
      ))}
    </div>
  );
};

export default ProjectList;
