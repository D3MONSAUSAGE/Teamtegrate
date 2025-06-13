
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Rocket, Sparkles } from 'lucide-react';
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
    <div className="p-8">
      {projects.length > 0 ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/10 backdrop-blur-sm border border-primary/20">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Your Projects
                </h2>
                <p className="text-muted-foreground mt-1">
                  {projects.length} active project{projects.length !== 1 ? 's' : ''} in your workspace
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => {
              console.log('ProjectsGridSection: Rendering project card for:', project.id, project.title);
              return (
                <div 
                  key={project.id} 
                  className="group transition-all duration-700 hover:scale-[1.03] animate-fade-in hover:-translate-y-2"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative">
                    {/* Enhanced glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/15 to-secondary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-125" />
                    
                    {/* Floating border effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-card/95 via-card/90 to-card/85 border-2 border-border/30 rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:border-primary/50 transition-all duration-500">
                      <ProjectCard
                        project={project}
                        onViewTasks={() => handleViewTasks(project.id)}
                        onCreateTask={() => handleCreateTask(project.id)}
                        onDeleted={handleProjectDeleted}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-12">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/5 rounded-3xl flex items-center justify-center backdrop-blur-sm border-2 border-border/30 shadow-2xl">
                <Rocket className="h-16 w-16 text-primary" />
              </div>
              <div className="absolute -top-4 -right-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/10 flex items-center justify-center backdrop-blur-sm border border-accent/30">
                  <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="space-y-6 mb-12">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                {searchQuery ? 'No projects found' : 'Your Creative Journey Starts Here'}
              </h3>
              <p className="text-muted-foreground text-xl leading-relaxed max-w-xl mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search criteria to find what you\'re looking for.' 
                  : 'Create your first project and transform your ideas into organized, actionable plans that drive real results.'
                }
              </p>
            </div>
            
            {!searchQuery && (
              <Button 
                onClick={onCreateProject} 
                size="lg"
                className="h-16 px-12 rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-primary-foreground font-bold shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 border-2 border-primary/30 hover:border-primary/50 group relative overflow-hidden text-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="h-6 w-6 mr-4 group-hover:rotate-180 transition-transform duration-500" />
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
