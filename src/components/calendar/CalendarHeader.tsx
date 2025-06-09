
import React from 'react';
import { CalendarIcon } from 'lucide-react';

interface CalendarHeaderProps {
  children?: React.ReactNode;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ children }) => {
  return (
    <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 border-b border-border/50 backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        {/* Title and Actions Row */}
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Calendar
            </h1>
            <p className="text-muted-foreground text-sm mt-1 hidden sm:block">
              Organize and track your tasks by date
            </p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
