
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

  const TreeAnimation = () => (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg" />
      
      {/* Tree Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        {/* Trunk - grows smoothly with progress */}
        <div 
          className={getAnimationClass("w-3 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg mx-auto")}
          style={{
            height: `${Math.max(0, (safeProgress / 100) * 80)}px`, // Smooth height scaling
            minHeight: stage === 'seed' ? '0px' : '16px'
          }}
        />
        
        {/* Leaves/Crown */}
        <div className="relative">
          {stage !== 'seed' && (
            <>
              {/* Main crown - scales with progress */}
              <div 
                className={getAnimationClass(
                  "absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                )}
                style={{
                  width: `${Math.max(16, (safeProgress / 100) * 80)}px`,
                  height: `${Math.max(16, (safeProgress / 100) * 80)}px`
                }}
              />
              
              {/* Side branches for larger stages */}
              {safeProgress >= 50 && (
                <>
                  <div 
                    className={getAnimationClass(
                      "absolute -top-1 -left-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                    )}
                    style={{
                      width: `${Math.max(24, ((safeProgress - 50) / 50) * 40)}px`,
                      height: `${Math.max(24, ((safeProgress - 50) / 50) * 40)}px`
                    }}
                  />
                  <div 
                    className={getAnimationClass(
                      "absolute -top-1 -right-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                    )}
                    style={{
                      width: `${Math.max(24, ((safeProgress - 50) / 50) * 40)}px`,
                      height: `${Math.max(24, ((safeProgress - 50) / 50) * 40)}px`
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
            </>
          )}
        </div>
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

  const FlowerAnimation = () => (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg" />
      
      {/* Flower Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        {/* Stem - grows with progress */}
        <div 
          className={getAnimationClass("w-2 bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg mx-auto")}
          style={{
            height: `${Math.max(0, (safeProgress / 100) * 128)}px`
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
                  width: `${Math.max(24, ((safeProgress - 25) / 75) * 72)}px`,
                  height: `${Math.max(24, ((safeProgress - 25) / 75) * 72)}px`
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

  const CityAnimation = () => (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-6 bg-gradient-to-r from-gray-300/30 to-gray-400/30" />
      
      {/* Buildings */}
      <div className="absolute bottom-6 w-full flex justify-center items-end gap-1">
        {[...Array(5)].map((_, i) => {
          const maxHeights = [64, 96, 128, 80, 48];
          const currentHeight = Math.max(0, (safeProgress / 100) * maxHeights[i]);
          
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
