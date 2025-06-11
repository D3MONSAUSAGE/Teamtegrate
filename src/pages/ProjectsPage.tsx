
import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Sparkles, FolderKanban } from 'lucide-react';
import ProjectCard from '@/components/project-card';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { useNavigate } from 'react-router-dom';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects, isLoading, refreshProjects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewTasks = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}/tasks`);
  };

  const handleCreateTask = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}/tasks`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-card border shadow-2xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-3xl p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground font-medium">Loading your projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-gradient">
                  My Projects
                </h1>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl leading-relaxed">
              Organize and manage your projects with style and efficiency
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-primary/20"
          >
            <Plus className="h-5 w-5 mr-3" />
            New Project
          </Button>
        </div>
        
        {/* Search Section */}
        <div className="glass-card border shadow-lg bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm focus:border-primary/50 focus:bg-background/80 transition-all duration-300"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="glass-card border shadow-lg bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-6">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="group transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProjectCard
                    project={project}
                    onViewTasks={() => handleViewTasks(project.id)}
                    onCreateTask={() => handleCreateTask(project.id)}
                    onDeleted={refreshProjects}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card border shadow-lg bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 rounded-full bg-gradient-to-r from-muted/50 to-muted/30">
                  <FolderKanban className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {searchQuery ? 'No projects found' : 'No projects yet'}
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-md">
                    {searchQuery 
                      ? 'Try adjusting your search criteria to find what you\'re looking for.' 
                      : 'Start organizing your work by creating your first project and unlock your productivity potential'
                    }
                  </p>
                </div>
                {!searchQuery && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    size="lg"
                    className="mt-4 h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Create Your First Project
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refreshProjects}
      />
    </div>
  );
};

export default ProjectsPage;
