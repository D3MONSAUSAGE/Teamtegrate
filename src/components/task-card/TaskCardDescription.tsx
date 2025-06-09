
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
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground italic">No description provided</p>
      </div>
    );
  }

  // If the description is short, don't enable expansion
  const isExpandable = description.length > 100;
  const shouldShowExpansion = isExpandable && !expanded;

  return (
    <div className="px-4 pb-2">
      <div 
        className="relative cursor-pointer"
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <p className={cn(
          "text-xs text-muted-foreground leading-relaxed",
          shouldShowExpansion ? "line-clamp-2" : ""
        )}>
          {description}
        </p>
        
        {shouldShowExpansion && (
          <div className="absolute bottom-0 right-0 bg-gradient-to-l from-background via-background to-transparent pl-2">
            <span className="text-xs text-primary hover:text-primary/80 font-medium">
              ...more
            </span>
          </div>
        )}
        
        {expanded && isExpandable && (
          <button className="text-xs text-primary hover:text-primary/80 mt-1 font-medium">
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCardDescription;
