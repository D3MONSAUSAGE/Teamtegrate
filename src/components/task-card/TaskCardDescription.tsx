
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
      <div className="py-2">
        <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg border border-border/30">
          No description provided
        </p>
      </div>
    );
  }

  // If the description is short, don't enable expansion
  const isExpandable = description.length > 120;
  const shouldShowExpansion = isExpandable && !expanded;

  return (
    <div className="py-2">
      <div 
        className="relative cursor-pointer group"
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <div className="bg-muted/20 p-3 rounded-lg border border-border/30 hover:border-border/50 transition-all duration-200">
          <p className={cn(
            "text-sm text-muted-foreground leading-relaxed",
            shouldShowExpansion ? "line-clamp-3" : ""
          )}>
            {description}
          </p>
          
          {shouldShowExpansion && (
            <div className="absolute bottom-3 right-3 bg-gradient-to-l from-card via-card to-transparent pl-3">
              <span className="text-xs text-primary hover:text-primary/80 font-medium">
                ...read more
              </span>
            </div>
          )}
          
          {expanded && isExpandable && (
            <button className="text-xs text-primary hover:text-primary/80 mt-2 font-medium">
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardDescription;
