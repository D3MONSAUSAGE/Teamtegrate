
import React from 'react';
import TreeAnimation from './TreeAnimation';
import FlowerAnimation from './FlowerAnimation';
import CityAnimationSimple from './CityAnimationSimple';
import { shouldReduceMotion } from './AnimationUtils';
import './AnimationStyles.css';

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
  const reducedMotion = shouldReduceMotion();

  const renderAnimation = () => {
    const commonProps = {
      progress,
      isActive: isActive && !reducedMotion
    };

    switch (animationType) {
      case 'flower':
        return <FlowerAnimation {...commonProps} />;
      case 'city':
        return <CityAnimationSimple {...commonProps} />;
      default:
        return <TreeAnimation {...commonProps} />;
    }
  };

  return (
    <div className="gpu-accelerated">
      {renderAnimation()}
    </div>
  );
};

export default AnimationController;
