
import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Sparkles, FolderKanban, Zap } from 'lucide-react';
import ProjectCard from '@/components/project-card';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { useNavigate } from 'react-router-dom';
import { FlatProject } from '@/types/flat';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects, isLoading, refreshProjects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Convert Projects to FlatProjects for compatibility
  const flatProjects: FlatProject[] = projects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    managerId: project.managerId,
    organizationId: project.organizationId || user?.organizationId || '',
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  }));

  const filteredProjects = flatProjects.filter(project =>
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
        {/* Enhanced Loading Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/15 to-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-accent/15 to-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-gradient-to-br from-secondary/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-secondary/40 rounded-full animate-ping" style={{ animationDelay: '2.5s' }} />
        </div>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-card border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-2xl rounded-3xl p-12 text-center animate-scale-in">
            <div className="relative mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-3">
              Loading Projects
            </h3>
            <p className="text-muted-foreground font-medium text-lg">Preparing your creative workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/15 to-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-accent/15 to-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-gradient-to-br from-secondary/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Additional floating elements */}
        <div className="absolute top-20 left-1/4 w-3 h-3 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-accent/30 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-secondary/30 rounded-full animate-ping" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-2/3 right-1/2 w-1.5 h-1.5 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 space-y-8">
        {/* Spectacular Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-gradient leading-tight">
                  My Projects
                </h1>
                <div className="absolute -top-3 -right-3 flex space-x-2">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  <Zap className="h-6 w-6 text-accent animate-bounce" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-accent/30 to-transparent rounded-full" />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="h-16 px-10 rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-primary-foreground font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 border-2 border-primary/30 hover:border-primary/50 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Create Project</span>
          </Button>
        </div>
        
        {/* Enhanced Search Section */}
        <div className="glass-card border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-2xl rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="relative max-w-md">
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <Input
              placeholder="Search your projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 rounded-2xl border-2 border-border/50 bg-background/60 backdrop-blur-sm focus:border-primary/60 focus:bg-background/80 transition-all duration-300 text-lg font-medium shadow-inner hover:shadow-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {filteredProjects.length}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Projects Grid */}
        <div className="glass-card border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-2xl rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
          {filteredProjects.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Your Projects
                </h2>
                <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
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
                        onDeleted={refreshProjects}
                      />
                    </div>
                  </div>
                ))}
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
                    onClick={() => setIsCreateDialogOpen(true)} 
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
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default ProjectsPage;
