
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="text-center glass-card p-8 rounded-2xl animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Loading...</h3>
        <p className="text-muted-foreground">Preparing your experience...</p>
      </div>
    </div>
  );
};

export default LoadingFallback;
