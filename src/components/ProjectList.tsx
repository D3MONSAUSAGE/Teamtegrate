
import React from 'react';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectListProps {
  projects: Project[];
  searchQuery: string;
  onEditProject: (project: Project) => void;
  onViewTasks: (project: Project) => void;
  onCreateProject: () => void;
  onCreateTask: (project: Project) => void;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  searchQuery,
  onEditProject,
  onViewTasks,
  onCreateProject,
  onCreateTask,
  isLoading = false,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 w-full bg-gray-50/50 dark:bg-gray-900/20 rounded-lg border border-dashed">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-2">Failed to load projects</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry || (() => window.location.reload())}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  // Filter projects based on search query if needed
  const filteredProjects = Array.isArray(projects) 
    ? projects.filter(project => 
        project && (
          (project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (project.description && project.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-dashed text-center flex flex-col items-center">
        <img 
          src="/placeholder.svg" 
          alt="No projects" 
          className="h-32 w-32 opacity-20 mb-6"
        />
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {searchQuery ? 'No projects found matching your search' : 'No projects created yet'}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-md">
          {searchQuery 
            ? 'Try a different search term or clear your search' 
            : 'Create your first project to organize tasks and track progress'}
        </p>
        <Button 
          size="default" 
          onClick={onCreateProject}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {filteredProjects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <ProjectCard 
            project={project} 
            onEdit={onEditProject} 
            onViewTasks={() => onViewTasks(project)}
            onCreateTask={() => onCreateTask(project)}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default ProjectList;
