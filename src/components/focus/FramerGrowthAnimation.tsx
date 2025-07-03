
import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import FramerAnimationController from './animations/FramerAnimationController';
import EnhancedFlowerAnimation from './animations/EnhancedFlowerAnimation';
import { getGrowthStage, getStageMessage } from './animations/GrowthStageUtils';
import GrowthAnimationHeader from './components/GrowthAnimationHeader';
import GrowthProgressDisplay from './components/GrowthProgressDisplay';
import GrowthStageMessage from './components/GrowthStageMessage';
import GrowthProgressBar from './components/GrowthProgressBar';
import MilestoneNotification from './components/MilestoneNotification';

interface FramerGrowthAnimationProps {
  progress: number; // 0-100
  animationType: 'tree' | 'flower' | 'city' | 'ocean' | 'space';
  isActive: boolean;
}

const FramerGrowthAnimation: React.FC<FramerGrowthAnimationProps> = ({
  progress,
  animationType,
  isActive
}) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const stage = getGrowthStage(safeProgress);

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

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card className="p-6 glass-card overflow-hidden relative">
        <GrowthAnimationHeader 
          animationType={animationType}
          isActive={isActive}
        />

        {/* Enhanced Animation Container */}
        {animationType === 'flower' ? (
          <EnhancedFlowerAnimation 
            progress={safeProgress}
            isActive={isActive}
          />
        ) : (
          <FramerAnimationController 
            progress={safeProgress}
            animationType={animationType}
            isActive={isActive}
          />
        )}

        <div className="mt-4 text-center">
          <GrowthProgressDisplay 
            progress={safeProgress}
            isActive={isActive}
          />
          
          <GrowthStageMessage 
            stageMessage={getStageMessage(stage)}
            isActive={isActive}
          />
          
          {/* Enhanced Progress Bar with Physics */}
          <GrowthProgressBar 
            progress={safeProgress}
            isActive={isActive}
          />

          {/* Milestone Achievement Notification */}
          <MilestoneNotification 
            progress={safeProgress}
            isActive={isActive}
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default FramerGrowthAnimation;
