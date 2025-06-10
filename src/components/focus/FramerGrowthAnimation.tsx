
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import FramerAnimationController from './animations/FramerAnimationController';
import { getGrowthStage, getStageMessage } from './animations/GrowthStageUtils';
import { MILESTONE_PERCENTAGES, shouldReduceMotion } from './animations/AnimationUtils';
import { motion } from 'framer-motion';

interface FramerGrowthAnimationProps {
  progress: number; // 0-100
  animationType: 'tree' | 'flower' | 'city';
  isActive: boolean;
}

const FramerGrowthAnimation: React.FC<FramerGrowthAnimationProps> = ({
  progress,
  animationType,
  isActive
}) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const stage = getGrowthStage(safeProgress);
  const reducedMotion = shouldReduceMotion();
  const isMilestone = MILESTONE_PERCENTAGES.some(milestone => milestone === safeProgress);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const progressBarVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${safeProgress}%`,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card className="p-6 glass-card overflow-hidden relative">
        <div className="text-center mb-4">
          <motion.h3 
            className="text-lg font-semibold mb-2"
            animate={{
              color: isActive ? '#22c55e' : 'currentColor'
            }}
            transition={{ duration: 0.3 }}
          >
            Growth Progress
          </motion.h3>
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{
              opacity: isActive ? 0.9 : 0.7
            }}
          >
            Watch your {animationType} grow as you stay focused
          </motion.p>
        </div>

        {/* Enhanced Animation Container */}
        <FramerAnimationController 
          progress={safeProgress}
          animationType={animationType}
          isActive={isActive}
        />

        <div className="mt-4 text-center">
          <motion.div 
            className={cn(
              "text-2xl font-bold mb-2",
              isActive ? "text-primary" : "text-foreground"
            )}
            animate={{
              scale: isActive ? [1, 1.05, 1] : 1,
              textShadow: isActive ? [
                '0 0 0px currentColor',
                '0 0 20px currentColor',
                '0 0 0px currentColor'
              ] : '0 0 0px currentColor'
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              textShadow: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            {safeProgress}%
          </motion.div>
          
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
            {getStageMessage(stage)}
          </motion.div>
          
          {/* Enhanced Progress Bar with Physics */}
          <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden relative">
            <motion.div 
              className={cn(
                "h-full rounded-full relative",
                isActive ? "bg-gradient-to-r from-primary to-primary/70" : "bg-muted-foreground/50"
              )}
              variants={progressBarVariants}
              animate={{
                boxShadow: isActive && !reducedMotion ? [
                  '0 0 0px currentColor',
                  '0 0 15px currentColor',
                  '0 0 0px currentColor'
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
                  safeProgress >= milestone ? "bg-primary/60" : "bg-primary/30"
                )}
                style={{ left: `${milestone}%` }}
                animate={{
                  scale: safeProgress >= milestone ? [1, 1.2, 1] : 1
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Milestone Achievement Notification */}
          {isMilestone && isActive && (
            <motion.div
              className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1], 
                opacity: [0, 1, 1, 0] 
              }}
              transition={{
                duration: 3,
                times: [0, 0.2, 0.8, 1],
                ease: "easeOut"
              }}
            >
              Milestone! 🎉
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default FramerGrowthAnimation;
