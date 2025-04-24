
import React, { useState } from 'react';
import { Project } from '@/types';
import ProjectList from '@/components/ProjectList';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectDebugTools from './ProjectDebugTools';
import { useProjectDialogs } from './ProjectContainer';

interface ProjectContentProps {
  projects: Project[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}

const ProjectContent: React.FC<ProjectContentProps> = ({
  projects,
  isLoading,
  error,
  onRetry
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const dialogs = useProjectDialogs();

  // Filter and sort projects
  const filteredProjects = Array.isArray(projects) 
    ? projects.filter((project) => {
        if (!project) return false;
        return (
          (project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : [];

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'start':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'end':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'progress':
        const progressA = calculateProgress(a);
        const progressB = calculateProgress(b);
        return progressB - progressA;
      default:
        return 0;
    }
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <ProjectToolbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onCreateProject={dialogs.openCreateProject}
      />
      
      {process.env.NODE_ENV !== 'production' && (
        <ProjectDebugTools onRefresh={onRetry} />
      )}
      
      <ProjectList 
        projects={sortedProjects}
        searchQuery={searchQuery}
        onEditProject={dialogs.openEditProject}
        onViewTasks={dialogs.openViewTasks}
        onCreateProject={dialogs.openCreateProject}
        onCreateTask={dialogs.openCreateTask}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />
    </div>
  );
};

// Helper function to calculate project progress
const calculateProgress = (project: Project): number => {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const completed = project.tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completed / project.tasks.length) * 100);
};

export default ProjectContent;
