import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GrowthAnimationProps {
  progress: number; // 0-100
  animationType: 'tree' | 'flower' | 'city';
  isActive: boolean;
}

const GrowthAnimation: React.FC<GrowthAnimationProps> = ({
  progress,
  animationType,
  isActive
}) => {
  const getGrowthStage = (progress: number) => {
    const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
    if (safeProgress === 0) return 'seed';
    if (safeProgress < 25) return 'sprout';
    if (safeProgress < 50) return 'small';
    if (safeProgress < 75) return 'medium';
    if (safeProgress < 100) return 'large';
    return 'complete';
  };

  const stage = getGrowthStage(progress);
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

  // Enhanced animation timing for smooth growth
  const getAnimationClass = (baseClass: string) => {
    return cn(
      baseClass,
      "transition-all duration-500 ease-out", // Smooth transitions
      isActive && stage !== 'seed' && "animate-pulse"
    );
  };

  const TreeAnimation = () => {
    // Improved scaling functions for more visible growth at lower percentages
    const getTrunkHeight = (progress: number) => {
      if (progress === 0) return 0;
      // Start with a base height and scale more aggressively early on
      return Math.max(20, 20 + (progress / 100) * 60); // 20px base + up to 60px growth
    };

    const getCrownSize = (progress: number) => {
      if (progress === 0) return 0;
      // More aggressive scaling for crown to be visible earlier
      return Math.max(24, 24 + (progress / 100) * 56); // 24px base + up to 56px growth
    };

    const getSideBranchSize = (progress: number) => {
      if (progress < 25) return 0;
      // Scale side branches based on progress above 25%
      const adjustedProgress = (progress - 25) / 75; // 0-1 range for 25-100%
      return Math.max(16, 16 + adjustedProgress * 32); // 16px base + up to 32px growth
    };

    return (
      <div className="relative w-full h-80 overflow-hidden">
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg" />
        
        {/* Tree Container */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          {/* Leaves/Crown - now at the top */}
          {stage !== 'seed' && (
            <div className="relative mb-2">
              {/* Main crown */}
              <div 
                className={getAnimationClass(
                  "bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                )}
                style={{
                  width: `${getCrownSize(safeProgress)}px`,
                  height: `${getCrownSize(safeProgress)}px`
                }}
              />
              
              {/* Side branches for larger stages */}
              {safeProgress >= 25 && (
                <>
                  <div 
                    className={getAnimationClass(
                      "absolute top-1 -left-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                    )}
                    style={{
                      width: `${getSideBranchSize(safeProgress)}px`,
                      height: `${getSideBranchSize(safeProgress)}px`
                    }}
                  />
                  <div 
                    className={getAnimationClass(
                      "absolute top-1 -right-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                    )}
                    style={{
                      width: `${getSideBranchSize(safeProgress)}px`,
                      height: `${getSideBranchSize(safeProgress)}px`
                    }}
                  />
                </>
              )}
              
              {/* Flowers for complete stage */}
              {stage === 'complete' && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-pink-400 rounded-full" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Trunk - now at the bottom */}
          <div 
            className={getAnimationClass("w-3 bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg")}
            style={{
              height: `${getTrunkHeight(safeProgress)}px`,
              minHeight: stage === 'seed' ? '0px' : '20px'
            }}
          />
        </div>
        
        {/* Floating particles for active state */}
        {isActive && stage !== 'seed' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full opacity-70 animate-bounce"
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const FlowerAnimation = () => {
    const getStemHeight = (progress: number) => {
      if (progress === 0) return 0;
      return Math.max(32, 32 + (progress / 100) * 96); // 32px base + up to 96px growth
    };

    const getFlowerSize = (progress: number) => {
      if (progress < 25) return 0;
      const adjustedProgress = (progress - 25) / 75;
      return Math.max(24, 24 + adjustedProgress * 48); // 24px base + up to 48px growth
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

  const CityAnimation = () => {
    const getBuildingHeight = (progress: number, maxHeight: number) => {
      if (progress === 0) return 0;
      // More aggressive scaling for buildings to be visible earlier
      return Math.max(8, (progress / 100) * maxHeight);
    };

    return (
      <div className="relative w-full h-80 overflow-hidden">
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-6 bg-gradient-to-r from-gray-300/30 to-gray-400/30" />
        
        {/* Buildings */}
        <div className="absolute bottom-6 w-full flex justify-center items-end gap-1">
          {[...Array(5)].map((_, i) => {
            const maxHeights = [64, 96, 128, 80, 48];
            const currentHeight = getBuildingHeight(safeProgress, maxHeights[i]);
            
            return (
              <div
                key={i}
                className={getAnimationClass("bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm w-8")}
                style={{ 
                  height: `${currentHeight}px`,
                  minHeight: safeProgress > 0 ? '8px' : '0px'
                }}
              >
                {/* Windows */}
                {currentHeight > 16 && (
                  <div className="flex flex-col gap-1 p-1 pt-2">
                    {[...Array(Math.floor(currentHeight / 24))].map((_, windowRow) => (
                      <div key={windowRow} className="flex gap-1">
                        <div className="w-1 h-1 bg-yellow-300 rounded-sm opacity-70" />
                        <div className="w-1 h-1 bg-yellow-300 rounded-sm opacity-70" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAnimation = () => {
    switch (animationType) {
      case 'flower':
        return <FlowerAnimation />;
      case 'city':
        return <CityAnimation />;
      default:
        return <TreeAnimation />;
    }
  };

  const getStageMessage = () => {
    switch (stage) {
      case 'seed': return 'Ready to plant your focus';
      case 'sprout': return 'Beginning to grow';
      case 'small': return 'Making progress';
      case 'medium': return 'Growing strong';
      case 'large': return 'Almost there';
      case 'complete': return 'Fully grown!';
      default: return 'Growing...';
    }
  };

  return (
    <Card className="p-6 glass-card">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Growth Progress</h3>
        <p className="text-sm text-muted-foreground">
          Watch your {animationType} grow as you stay focused
        </p>
      </div>

      {renderAnimation()}

      <div className="mt-4 text-center">
        <div className={cn(
          "text-2xl font-bold transition-colors duration-300",
          isActive ? "text-primary" : "text-foreground"
        )}>
          {safeProgress}%
        </div>
        <div className="text-sm text-muted-foreground transition-all duration-300">
          {getStageMessage()}
        </div>
      </div>
    </Card>
  );
};

export default GrowthAnimation;
