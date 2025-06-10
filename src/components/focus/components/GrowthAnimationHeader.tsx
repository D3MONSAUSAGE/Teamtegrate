
import React from 'react';
import { motion } from 'framer-motion';

interface GrowthAnimationHeaderProps {
  animationType: 'tree' | 'flower' | 'city' | 'ocean' | 'space';
  isActive: boolean;
}

const GrowthAnimationHeader: React.FC<GrowthAnimationHeaderProps> = ({
  animationType,
  isActive
}) => {
  const getAnimationDescription = () => {
    switch (animationType) {
      case 'tree':
        return 'forest';
      case 'flower':
        return 'garden';
      case 'city':
        return 'city';
      case 'ocean':
        return 'coral reef';
      case 'space':
        return 'planetary system';
      default:
        return animationType;
    }
  };

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
        Watch your {getAnimationDescription()} grow as you stay focused
      </motion.p>
    </div>
  );
};

export default GrowthAnimationHeader;
