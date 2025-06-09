
import React from 'react';
import { cn } from '@/lib/utils';

interface FlowerAnimationProps {
  progress: number;
  isActive: boolean;
}

const FlowerAnimation: React.FC<FlowerAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

  const getStemHeight = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(32, 32 + (progress / 100) * 96);
  };

  const getFlowerSize = (progress: number) => {
    if (progress < 25) return 0;
    const adjustedProgress = (progress - 25) / 75;
    return Math.max(24, 24 + adjustedProgress * 48);
  };

  const getAnimationClass = (baseClass: string) => {
    return cn(
      baseClass,
      "transition-all duration-500 ease-out",
      isActive && safeProgress > 0 && "animate-pulse"
    );
  };

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg" />
      
      {/* Flower Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        {/* Stem - grows with progress */}
        <div 
          className={getAnimationClass("w-2 bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg mx-auto")}
          style={{
            height: `${getStemHeight(safeProgress)}px`
          }}
        />
        
        {/* Flower head */}
        {safeProgress >= 25 && (
          <div className="relative">
            <div 
              className={getAnimationClass("absolute -top-2 left-1/2 transform -translate-x-1/2")}
            >
              {/* Petals */}
              <div 
                className="relative"
                style={{
                  width: `${getFlowerSize(safeProgress)}px`,
                  height: `${getFlowerSize(safeProgress)}px`
                }}
              >
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-6 bg-gradient-to-t from-pink-400 to-pink-300 rounded-full transition-all duration-500"
                    style={{
                      transform: `rotate(${i * 45}deg) translateY(-50%)`,
                      transformOrigin: 'center bottom',
                      top: '50%',
                      left: '50%',
                      marginLeft: '-6px',
                      opacity: Math.min(1, (safeProgress - 25) / 75)
                    }}
                  />
                ))}
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full transition-all duration-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowerAnimation;
