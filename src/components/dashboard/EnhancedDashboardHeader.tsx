
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, TrendingUp, Calendar, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnhancedDashboardHeaderProps {
  userName: string;
  onCreateTask: () => void;
  isLoading: boolean;
  stats: {
    todaysCount: number;
    upcomingCount: number;
    projectsCount: string | number;
  };
}

const EnhancedDashboardHeader: React.FC<EnhancedDashboardHeaderProps> = ({
  userName,
  onCreateTask,
  isLoading,
  stats
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card/95 border shadow-lg">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-full blur-2xl" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Welcome Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-emerald-600 bg-clip-text text-transparent">
                  Welcome back, {userName}!
                </h1>
                <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-base md:text-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span>Stay productive today</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 pt-2">
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-primary group-hover:scale-110 transition-transform">
                  {stats.todaysCount}
                </div>
                <div className="text-sm text-muted-foreground">Today's Tasks</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-emerald-600 group-hover:scale-110 transition-transform">
                  {stats.upcomingCount}
                </div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-amber-600 group-hover:scale-110 transition-transform">
                  {stats.projectsCount}
                </div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex-shrink-0">
            <Button 
              onClick={onCreateTask} 
              size={isMobile ? "default" : "lg"} 
              className="relative overflow-hidden bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Create New Task
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardHeader;
