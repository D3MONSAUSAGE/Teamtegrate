
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Zap, Clock, Star } from 'lucide-react';

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'Low': 
        return {
          color: 'bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 text-blue-800 dark:from-blue-950/60 dark:via-blue-900/70 dark:to-blue-800/60 dark:text-blue-200 border-blue-300/70 dark:border-blue-700/70',
          icon: Clock,
          shadowColor: 'shadow-blue-300/60 dark:shadow-blue-900/40',
          ringColor: 'ring-blue-200/50 dark:ring-blue-800/50'
        };
      case 'Medium': 
        return {
          color: 'bg-gradient-to-r from-amber-50 via-amber-100 to-amber-200 text-amber-800 dark:from-amber-950/60 dark:via-amber-900/70 dark:to-amber-800/60 dark:text-amber-200 border-amber-300/70 dark:border-amber-700/70',
          icon: AlertCircle,
          shadowColor: 'shadow-amber-300/60 dark:shadow-amber-900/40',
          ringColor: 'ring-amber-200/50 dark:ring-amber-800/50'
        };
      case 'High': 
        return {
          color: 'bg-gradient-to-r from-red-50 via-red-100 to-red-200 text-red-800 dark:from-red-950/60 dark:via-red-900/70 dark:to-red-800/60 dark:text-red-200 border-red-300/70 dark:border-red-700/70',
          icon: Zap,
          shadowColor: 'shadow-red-300/60 dark:shadow-red-900/40',
          ringColor: 'ring-red-200/50 dark:ring-red-800/50'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 text-gray-800 dark:from-gray-950/60 dark:via-gray-900/70 dark:to-gray-800/60 dark:text-gray-200 border-gray-300/70 dark:border-gray-700/70',
          icon: Star,
          shadowColor: 'shadow-gray-300/60 dark:shadow-gray-900/40',
          ringColor: 'ring-gray-200/50 dark:ring-gray-800/50'
        };
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <CardHeader className="p-5 pb-3 space-y-4 relative">
      {/* Enhanced Priority Badge with modern floating design */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className={cn(
          "font-bold rounded-xl border-2 backdrop-blur-md",
          "flex items-center gap-2 px-3 py-1.5 text-xs",
          "transition-all duration-500 hover:scale-110 transform-gpu",
          "shadow-lg hover:shadow-xl ring-1",
          priorityConfig.color,
          priorityConfig.shadowColor,
          priorityConfig.ringColor
        )}>
          <PriorityIcon className="h-3.5 w-3.5 drop-shadow-sm" />
          <span className="font-semibold tracking-wide">{priority}</span>
        </Badge>
        
        {/* Enhanced glow effect with priority-based colors */}
        <div className={cn(
          "absolute inset-0 rounded-xl blur-lg opacity-30 -z-10 transition-opacity duration-500 group-hover:opacity-60",
          priority === 'High' && "bg-red-400",
          priority === 'Medium' && "bg-amber-400", 
          priority === 'Low' && "bg-blue-400",
          priority !== 'Low' && priority !== 'Medium' && priority !== 'High' && "bg-gray-400"
        )} />
      </div>

      {/* Enhanced Title with better typography */}
      <div className="pr-24">
        <CardTitle className={cn(
          "text-lg font-bold leading-snug text-foreground break-words",
          "group-hover:text-primary/90 transition-all duration-500",
          "tracking-tight drop-shadow-sm",
          "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text"
        )}>
          {title}
        </CardTitle>
        
        {/* Subtle underline animation */}
        <div className="mt-1 h-0.5 w-0 bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700 group-hover:w-16" />
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
