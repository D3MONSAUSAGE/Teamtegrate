
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GrowthStageMessageProps {
  stageMessage: string;
  isActive: boolean;
}

const GrowthStageMessage: React.FC<GrowthStageMessageProps> = ({
  stageMessage,
  isActive
}) => {
  return (
    <motion.div 
      className={cn(
        "text-sm text-muted-foreground mb-3",
        isActive && "text-primary/80"
      )}
      animate={{
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {stageMessage}
    </motion.div>
  );
};

export default GrowthStageMessage;
