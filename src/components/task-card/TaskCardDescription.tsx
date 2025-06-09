
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
      <div className="py-3">
        <p className="text-sm text-muted-foreground italic bg-gradient-to-r from-muted/20 to-muted/10 p-3 rounded-xl border border-border/30">
          No description provided
        </p>
      </div>
    );
  }

  // If the description is short, don't enable expansion
  const isExpandable = description.length > 120;
  const shouldShowExpansion = isExpandable && !expanded;

  return (
    <div className="py-3">
      <div 
        className="relative cursor-pointer group"
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <div className="bg-gradient-to-r from-muted/20 to-muted/10 p-4 rounded-xl border border-border/30 hover:border-border/50 transition-all duration-300">
          <p className={cn(
            "text-sm text-muted-foreground leading-relaxed",
            shouldShowExpansion ? "line-clamp-3" : ""
          )}>
            {description}
          </p>
          
          {shouldShowExpansion && (
            <div className="absolute bottom-4 right-4 bg-gradient-to-l from-card via-card to-transparent pl-4">
              <span className="text-sm text-primary hover:text-primary/80 font-semibold">
                ...read more
              </span>
            </div>
          )}
          
          {expanded && isExpandable && (
            <button className="text-sm text-primary hover:text-primary/80 mt-2 font-semibold">
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardDescription;
