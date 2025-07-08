
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectNotebookButtonProps {
  onClick: () => void;
  updateCount: number;
  hasUnreadUpdates?: boolean;
  className?: string;
}

const ProjectNotebookButton: React.FC<ProjectNotebookButtonProps> = ({
  onClick,
  updateCount,
  hasUnreadUpdates = false,
  className
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="relative flex items-center gap-2 border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-200"
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Project Journal</span>
        <MessageSquare className="h-3 w-3 opacity-60" />
        
        {updateCount > 0 && (
          <Badge 
            variant={hasUnreadUpdates ? "default" : "secondary"} 
            className="ml-1 h-5 min-w-[20px] text-xs flex items-center justify-center px-1.5"
          >
            {updateCount > 99 ? '99+' : updateCount}
          </Badge>
        )}
        
        {hasUnreadUpdates && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </Button>
    </motion.div>
  );
};

export default ProjectNotebookButton;
