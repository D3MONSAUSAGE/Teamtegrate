import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from 'lucide-react';
import { Project } from '@/types';
import ProjectCard from '@/components/project-card';

interface ProjectsGridSectionProps {
  projects: Project[];
  searchQuery: string;
  onCreateProject: () => void;
  onViewTasks: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
  onProjectDeleted: () => void;
}

const ProjectsGridSection: React.FC<ProjectsGridSectionProps> = ({
  projects,
  searchQuery,
  onCreateProject,
  onViewTasks,
  onCreateTask,
  onProjectDeleted
}) => {
  console.log('ProjectsGridSection: Rendering with props:', {
    projectsCount: projects.length,
    hasOnViewTasks: !!onViewTasks,
    hasOnCreateTask: !!onCreateTask,
    hasOnProjectDeleted: !!onProjectDeleted
  });

  const handleViewTasks = (projectId: string) => {
    console.log('ProjectsGridSection: handleViewTasks called for project:', projectId);
    if (onViewTasks) {
      onViewTasks(projectId);
    } else {
      console.error('ProjectsGridSection: onViewTasks handler not provided');
    }
  };

  const handleCreateTask = (projectId: string) => {
    console.log('ProjectsGridSection: handleCreateTask called for project:', projectId);
    if (onCreateTask) {
      onCreateTask(projectId);
    } else {
      console.error('ProjectsGridSection: onCreateTask handler not provided');
    }
  };

  const handleProjectDeleted = () => {
    console.log('ProjectsGridSection: handleProjectDeleted called');
    if (onProjectDeleted) {
      onProjectDeleted();
    } else {
      console.error('ProjectsGridSection: onProjectDeleted handler not provided');
    }
  };

  return (
    <div className="glass-card border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-2xl rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
      {projects.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Your Projects
            </h2>
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => {
              console.log('ProjectsGridSection: Rendering project card for:', project.id, project.title);
              return (
                <div 
                  key={project.id} 
                  className="group transition-all duration-500 hover:scale-[1.03] animate-fade-in hover:-translate-y-2"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110" />
                    <ProjectCard
                      project={project}
                      onViewTasks={() => handleViewTasks(project.id)}
                      onCreateTask={() => handleCreateTask(project.id)}
                      onDeleted={handleProjectDeleted}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card border-2 border-dashed border-primary/30 bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-2xl rounded-3xl p-16 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="p-8 rounded-full bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/10 backdrop-blur-sm border border-primary/20">
                <FolderKanban className="h-16 w-16 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <Plus className="h-3 w-3 text-accent" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 max-w-md">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {searchQuery ? 'No projects found' : 'Your Creative Journey Starts Here'}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {searchQuery 
                  ? 'Try adjusting your search criteria to find what you\'re looking for.' 
                  : 'Create your first project and transform your ideas into organized, actionable plans that drive results'
                }
              </p>
            </div>
            
            {!searchQuery && (
              <Button 
                onClick={onCreateProject} 
                size="lg"
                className="mt-6 h-14 px-10 rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-primary-foreground font-bold shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-500 border border-primary/30 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="h-6 w-6 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">Launch Your First Project</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsGridSection;
