
import React from 'react';

const ProjectsPageBackground: React.FC = () => {
  return (
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
  );
};

export default ProjectsPageBackground;
