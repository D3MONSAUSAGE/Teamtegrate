
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Zap, FolderKanban } from 'lucide-react';

interface ProjectsPageHeaderProps {
  onCreateProject: () => void;
}

const ProjectsPageHeader: React.FC<ProjectsPageHeaderProps> = ({ onCreateProject }) => {
  return (
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
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Organize your ideas into actionable projects. Track progress, manage tasks, and collaborate with your team to achieve your goals.
        </p>
      </div>
      
      <Button 
        onClick={onCreateProject}
        size="lg"
        className="h-16 px-10 rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-primary-foreground font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 border-2 border-primary/30 hover:border-primary/50 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
        <span className="relative z-10">Create Project</span>
      </Button>
    </div>
  );
};

export default ProjectsPageHeader;
