
import React from 'react';
import FramerGrowthAnimation from './FramerGrowthAnimation';

interface EnhancedGrowthAnimationProps {
  progress: number;
  animationType: 'forest' | 'garden' | 'city' | 'ocean' | 'space';
  isActive: boolean;
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
}

const EnhancedGrowthAnimation: React.FC<EnhancedGrowthAnimationProps> = ({
  progress,
  animationType,
  isActive,
  timeOfDay
}) => {
  // Map the extended types to the Framer animation types
  const mappedAnimationType = (): 'tree' | 'flower' | 'city' | 'ocean' | 'space' => {
    switch (animationType) {
      case 'forest':
        return 'tree';
      case 'garden':
        return 'flower';
      case 'city':
        return 'city';
      case 'ocean':
        return 'ocean';
      case 'space':
        return 'space';
      default:
        return 'tree';
    }
  };

  return (
    <FramerGrowthAnimation
      progress={progress}
      animationType={mappedAnimationType()}
      isActive={isActive}
    />
  );
};

export default EnhancedGrowthAnimation;
