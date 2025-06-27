
import React from 'react';
import { CalendarIcon, Sparkles, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const CalendarHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border border-primary/10">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/90 to-card/95 backdrop-blur-sm" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Calendar Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-500">
                  <CalendarIcon className="h-10 w-10 text-primary" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500 animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                  Calendar
                </h1>
                <div className="flex items-center gap-4 text-base md:text-lg mt-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Task Management</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="flex items-center gap-6 pt-2">
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-primary group-hover:scale-110 transition-transform">
                  Today
                </div>
                <div className="text-sm text-muted-foreground">Current Focus</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                  Schedule
                </div>
                <div className="text-sm text-muted-foreground">Task Planning</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                  Organize
                </div>
                <div className="text-sm text-muted-foreground">Time Management</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
