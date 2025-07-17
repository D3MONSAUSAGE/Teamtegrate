
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Flag, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'High': 
        return {
          color: 'bg-gradient-to-r from-red-50 via-red-100 to-red-150 text-red-800 border-red-200 dark:from-red-950/60 dark:via-red-900/70 dark:to-red-800/60 dark:text-red-200 dark:border-red-700/60 shadow-red-100/50 dark:shadow-red-900/30',
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-300',
          ring: 'ring-red-200/40 dark:ring-red-800/40'
        };
      case 'Medium': 
        return {
          color: 'bg-gradient-to-r from-amber-50 via-amber-100 to-amber-150 text-amber-800 border-amber-200 dark:from-amber-950/60 dark:via-amber-900/70 dark:to-amber-800/60 dark:text-amber-200 dark:border-amber-700/60 shadow-amber-100/50 dark:shadow-amber-900/30',
          icon: Flag,
          iconColor: 'text-amber-600 dark:text-amber-300',
          ring: 'ring-amber-200/40 dark:ring-amber-800/40'
        };
      case 'Low': 
        return {
          color: 'bg-gradient-to-r from-blue-50 via-blue-100 to-blue-150 text-blue-800 border-blue-200 dark:from-blue-950/60 dark:via-blue-900/70 dark:to-blue-800/60 dark:text-blue-200 dark:border-blue-700/60 shadow-blue-100/50 dark:shadow-blue-900/30',
          icon: Star,
          iconColor: 'text-blue-600 dark:text-blue-300',
          ring: 'ring-blue-200/40 dark:ring-blue-800/40'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-50 via-gray-100 to-gray-150 text-gray-800 border-gray-200 dark:from-gray-850/60 dark:via-gray-800/70 dark:to-gray-750/60 dark:text-gray-200 dark:border-gray-600/60 shadow-gray-100/50 dark:shadow-gray-800/30',
          icon: Flag,
          iconColor: 'text-gray-600 dark:text-gray-300',
          ring: 'ring-gray-200/40 dark:ring-gray-700/40'
        };
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors duration-300 flex-1 line-clamp-2">
          {title}
        </h3>
        <Badge className={cn(
          "text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0 border-2 font-bold shadow-lg ring-2 backdrop-blur-sm",
          "transition-all duration-300 hover:scale-105 transform-gpu",
          priorityConfig.color,
          priorityConfig.ring
        )}>
          <PriorityIcon className={cn("h-3.5 w-3.5 drop-shadow-sm", priorityConfig.iconColor)} />
          <span className="tracking-wide">{priority}</span>
        </Badge>
      </div>
    </div>
  );
};

export default TaskCardHeader;
