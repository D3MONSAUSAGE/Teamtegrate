
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
  // Map the extended types to the basic ones for now
  const mappedAnimationType = animationType === 'forest' ? 'tree' : 
                             animationType === 'garden' ? 'flower' : 'city';

  return (
    <FramerGrowthAnimation
      progress={progress}
      animationType={mappedAnimationType}
      isActive={isActive}
    />
  );
};

export default EnhancedGrowthAnimation;
