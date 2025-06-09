
import React from 'react';
import TreeAnimation from './TreeAnimation';
import FlowerAnimation from './FlowerAnimation';
import CityAnimationSimple from './CityAnimationSimple';

interface AnimationControllerProps {
  progress: number;
  animationType: 'tree' | 'flower' | 'city';
  isActive: boolean;
}

const AnimationController: React.FC<AnimationControllerProps> = ({
  progress,
  animationType,
  isActive
}) => {
  const renderAnimation = () => {
    switch (animationType) {
      case 'flower':
        return <FlowerAnimation progress={progress} isActive={isActive} />;
      case 'city':
        return <CityAnimationSimple progress={progress} isActive={isActive} />;
      default:
        return <TreeAnimation progress={progress} isActive={isActive} />;
    }
  };

  return renderAnimation();
};

export default AnimationController;
