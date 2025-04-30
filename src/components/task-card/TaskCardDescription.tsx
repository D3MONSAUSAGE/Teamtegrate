
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TaskCardDescriptionProps {
  description: string;
}

const TaskCardDescription: React.FC<TaskCardDescriptionProps> = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  
  // If the description is short, don't enable expansion
  const isExpandable = description && description.length > 100;

  // Handle empty descriptions
  if (!description || description.trim() === '') {
    return (
      <p className="text-xs md:text-sm text-gray-400 italic">No description provided</p>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => isExpandable && setExpanded(true)}
      onMouseLeave={() => isExpandable && setExpanded(false)}
      onTouchStart={() => isExpandable && setExpanded(!expanded)}
    >
      <motion.p 
        className={cn(
          "text-xs md:text-sm text-gray-600",
          expanded ? "" : "line-clamp-2"
        )}
        animate={expanded ? { height: "auto" } : { height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        {description}
      </motion.p>
      
      {isExpandable && !expanded && (
        <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white dark:from-gray-800 py-0.5 px-1 text-xs text-gray-500">
          ...more
        </div>
      )}
    </div>
  );
};

// Helper function for class names
const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

export default TaskCardDescription;
