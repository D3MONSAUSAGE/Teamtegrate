
import React from 'react';
import { motion } from 'framer-motion';
import { MILESTONE_PERCENTAGES } from '../animations/AnimationUtils';

interface MilestoneNotificationProps {
  progress: number;
  isActive: boolean;
}

const MilestoneNotification: React.FC<MilestoneNotificationProps> = ({
  progress,
  isActive
}) => {
  const isMilestone = MILESTONE_PERCENTAGES.some(milestone => milestone === progress);

  if (!isMilestone || !isActive) return null;

  return (
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
  );
};

export default MilestoneNotification;
