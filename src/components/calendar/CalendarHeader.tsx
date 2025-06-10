
import React from 'react';
import { CalendarIcon, Sparkles } from 'lucide-react';

interface CalendarHeaderProps {
  children?: React.ReactNode;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ children }) => {
  return (
    <div className="flex-shrink-0 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-emerald-500/10 to-primary/5 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(134,239,172,0.1),transparent_70%)]" />
      
      <div className="relative glass-card border-0 shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-xl p-6 md:p-8">
        <div className="flex flex-col gap-4">
          {/* Title and Actions Row */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-emerald-500/20">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="relative">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-emerald-600 bg-clip-text text-transparent">
                    Calendar
                  </h1>
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-2 hidden sm:block">
                Organize and track your tasks by date with our enhanced calendar view
              </p>
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
