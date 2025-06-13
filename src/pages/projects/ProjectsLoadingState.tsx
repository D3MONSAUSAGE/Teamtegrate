
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const ProjectsLoadingState: React.FC = () => {
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
};

export default ProjectsLoadingState;
