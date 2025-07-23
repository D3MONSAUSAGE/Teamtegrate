
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MILESTONE_PERCENTAGES, shouldReduceMotion } from '../animations/AnimationUtils';

interface GrowthProgressBarProps {
  progress: number;
  isActive: boolean;
}

const GrowthProgressBar: React.FC<GrowthProgressBarProps> = ({
  progress,
  isActive
}) => {
  const reducedMotion = shouldReduceMotion();

  const progressBarVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${progress}%`,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  return (
    <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden relative">
      <motion.div 
        className={cn(
          "h-full rounded-full relative",
          isActive ? "bg-gradient-to-r from-primary to-primary/70" : "bg-muted-foreground/50"
        )}
        variants={progressBarVariants}
        animate={{
          boxShadow: isActive && !reducedMotion ? [
            '0 0 0px rgba(34, 197, 94, 0.5)',
            '0 0 15px rgba(34, 197, 94, 0.5)',
            '0 0 0px rgba(34, 197, 94, 0.5)'
          ] : 'none'
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        {/* Shimmer effect */}
        {isActive && !reducedMotion && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </motion.div>
      
      {/* Milestone markers with animation */}
      {MILESTONE_PERCENTAGES.slice(0, 3).map((milestone) => (
        <motion.div
          key={milestone}
          className={cn(
            "absolute top-0 w-0.5 h-full transition-all duration-300",
            progress >= milestone ? "bg-primary/60" : "bg-primary/30"
          )}
          style={{ left: `${milestone}%` }}
          animate={{
            scale: progress >= milestone ? [1, 1.2, 1] : 1
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

export default GrowthProgressBar;
