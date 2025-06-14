
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock, Zap, Star } from 'lucide-react';

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'Low': 
        return {
          color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60',
          icon: Clock,
          shadowColor: 'shadow-blue-200/40 dark:shadow-blue-900/30'
        };
      case 'Medium': 
        return {
          color: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 dark:from-amber-950/50 dark:to-amber-900/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
          icon: AlertCircle,
          shadowColor: 'shadow-amber-200/40 dark:shadow-amber-900/30'
        };
      case 'High': 
        return {
          color: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 dark:from-red-950/50 dark:to-red-900/50 dark:text-red-300 border-red-200/60 dark:border-red-800/60',
          icon: Zap,
          shadowColor: 'shadow-red-200/40 dark:shadow-red-900/30'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 dark:from-gray-950/50 dark:to-gray-900/50 dark:text-gray-300 border-gray-200/60 dark:border-gray-800/60',
          icon: Star,
          shadowColor: 'shadow-gray-200/40 dark:shadow-gray-900/30'
        };
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <CardHeader className="p-4 pb-3 space-y-3 relative">
      {/* Priority Badge - Positioned at top right to avoid title overlap */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className={cn(
          "font-semibold rounded-lg border backdrop-blur-sm",
          "flex items-center gap-1.5 px-2 py-1 text-xs",
          "transition-all duration-300 hover:scale-105",
          "shadow-md hover:shadow-lg",
          priorityConfig.color,
          priorityConfig.shadowColor
        )}>
          <PriorityIcon className="h-3 w-3" />
          <span>{priority}</span>
        </Badge>
        
        {/* Subtle glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-lg blur-sm opacity-20 -z-10 transition-opacity duration-300 group-hover:opacity-40",
          priority === 'High' && "bg-red-400",
          priority === 'Medium' && "bg-amber-400", 
          priority === 'Low' && "bg-blue-400"
        )} />
      </div>

      {/* Title with proper spacing and no overlap */}
      <div className="pr-20">
        <CardTitle className="text-base font-bold leading-tight text-foreground group-hover:text-primary/90 transition-colors duration-300 break-words">
          {title}
        </CardTitle>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
