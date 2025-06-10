
import React from 'react';
import { motion } from 'framer-motion';

interface GrowthAnimationHeaderProps {
  animationType: 'tree' | 'flower' | 'city';
  isActive: boolean;
}

const GrowthAnimationHeader: React.FC<GrowthAnimationHeaderProps> = ({
  animationType,
  isActive
}) => {
  return (
    <div className="text-center mb-4">
      <motion.h3 
        className="text-lg font-semibold mb-2"
        style={{
          color: isActive ? '#22c55e' : undefined
        }}
        animate={{
          color: isActive ? '#22c55e' : '#000000'
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
  );
};

export default GrowthAnimationHeader;
