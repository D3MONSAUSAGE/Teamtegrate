
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TaskCardDescriptionProps {
  description: string;
}

const TaskCardDescription: React.FC<TaskCardDescriptionProps> = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Handle empty descriptions
  if (!description || description.trim() === '') {
    return (
      <div className="bg-muted/30 p-3 rounded-md border border-border/30">
        <p className="text-sm text-muted-foreground italic flex items-center gap-2">
          <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
          No description provided
        </p>
      </div>
    );
  }

  // If the description is short, don't enable expansion
  const isExpandable = description.length > 100;
  const shouldShowExpansion = isExpandable && !expanded;

  return (
    <div 
      className={cn(
        "relative cursor-pointer group/desc transition-all duration-200",
        isExpandable && "hover:scale-[1.01]"
      )}
      onClick={() => isExpandable && setExpanded(!expanded)}
    >
      <div className="bg-muted/20 p-3 rounded-md border border-border/30 hover:border-border/50 transition-colors duration-200 relative overflow-hidden">
        <p className={cn(
          "text-sm text-muted-foreground leading-relaxed",
          shouldShowExpansion ? "line-clamp-2" : ""
        )}>
          {description}
        </p>
        
        {shouldShowExpansion && (
          <div className="absolute bottom-3 right-3 bg-gradient-to-l from-card via-card/95 to-transparent pl-4">
            <span className="text-xs text-primary font-medium">
              more...
            </span>
          </div>
        )}
        
        {expanded && isExpandable && (
          <button className="text-xs text-primary mt-2 font-medium">
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCardDescription;
