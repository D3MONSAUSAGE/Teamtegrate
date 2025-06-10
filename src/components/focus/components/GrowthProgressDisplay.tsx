
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GrowthProgressDisplayProps {
  progress: number;
  isActive: boolean;
}

const GrowthProgressDisplay: React.FC<GrowthProgressDisplayProps> = ({
  progress,
  isActive
}) => {
  return (
    <motion.div 
      className={cn(
        "text-2xl font-bold mb-2",
        isActive ? "text-primary" : "text-foreground"
      )}
      animate={{
        scale: isActive ? [1, 1.05, 1] : 1
      }}
      transition={{
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {progress}%
    </motion.div>
  );
};

export default GrowthProgressDisplay;
