
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

  const TreeAnimation = () => (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg" />
      
      {/* Tree Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        {/* Trunk */}
        <div 
          className={cn(
            "w-3 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg transition-all duration-1000 mx-auto",
            stage === 'seed' && "h-0",
            stage === 'sprout' && "h-4",
            stage === 'small' && "h-8",
            stage === 'medium' && "h-12",
            stage === 'large' && "h-16",
            stage === 'complete' && "h-20"
          )}
        />
        
        {/* Leaves/Crown */}
        <div className="relative">
          {stage !== 'seed' && (
            <>
              {/* Main crown */}
              <div 
                className={cn(
                  "absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-1000",
                  isActive && "animate-pulse",
                  stage === 'sprout' && "w-4 h-4",
                  stage === 'small' && "w-8 h-8",
                  stage === 'medium' && "w-12 h-12",
                  stage === 'large' && "w-16 h-16",
                  stage === 'complete' && "w-20 h-20"
                )}
              />
              
              {/* Side branches for larger stages */}
              {(stage === 'medium' || stage === 'large' || stage === 'complete') && (
                <>
                  <div 
                    className={cn(
                      "absolute -top-1 -left-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-1000 delay-300",
                      stage === 'medium' && "w-6 h-6",
                      stage === 'large' && "w-8 h-8",
                      stage === 'complete' && "w-10 h-10"
                    )}
                  />
                  <div 
                    className={cn(
                      "absolute -top-1 -right-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-1000 delay-500",
                      stage === 'medium' && "w-6 h-6",
                      stage === 'large' && "w-8 h-8",
                      stage === 'complete' && "w-10 h-10"
                    )}
                  />
                </>
              )}
              
              {/* Flowers for complete stage */}
              {stage === 'complete' && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
        {/* Stem */}
        <div 
          className={cn(
            "w-2 bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg transition-all duration-1000 mx-auto",
            stage === 'seed' && "h-0",
            stage === 'sprout' && "h-6",
            stage === 'small' && "h-12",
            stage === 'medium' && "h-18",
            stage === 'large' && "h-24",
            stage === 'complete' && "h-32"
          )}
        />
        
        {/* Flower head */}
        {stage !== 'seed' && stage !== 'sprout' && (
          <div className="relative">
            <div 
              className={cn(
                "absolute -top-2 left-1/2 transform -translate-x-1/2 transition-all duration-1000",
                isActive && "animate-pulse"
              )}
            >
              {/* Petals */}
              <div className={cn(
                "relative",
                stage === 'small' && "w-6 h-6",
                stage === 'medium' && "w-10 h-10",
                stage === 'large' && "w-14 h-14",
                stage === 'complete' && "w-18 h-18"
              )}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-6 bg-gradient-to-t from-pink-400 to-pink-300 rounded-full"
                    style={{
                      transform: `rotate(${i * 45}deg) translateY(-50%)`,
                      transformOrigin: 'center bottom',
                      top: '50%',
                      left: '50%',
                      marginLeft: '-6px'
                    }}
                  />
                ))}
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full" />
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
          const heights = [16, 24, 32, 20, 12];
          const maxHeights = [16, 24, 32, 20, 12];
          const currentHeight = Math.min(heights[i], (safeProgress / 100) * maxHeights[i] + (i + 1) * 2);
          
          return (
            <div
              key={i}
              className={cn(
                "bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 rounded-t-sm",
                "w-8",
                isActive && "animate-pulse"
              )}
              style={{ 
                height: `${Math.max(0, currentHeight)}px`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              {/* Windows */}
              {currentHeight > 8 && (
                <div className="flex flex-col gap-1 p-1 pt-2">
                  {[...Array(Math.floor(currentHeight / 6))].map((_, windowRow) => (
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
        <div className="text-2xl font-bold text-primary">{safeProgress}%</div>
        <div className="text-sm text-muted-foreground capitalize">
          {stage === 'seed' && 'Ready to plant your focus'}
          {stage === 'sprout' && 'Beginning to grow'}
          {stage === 'small' && 'Making progress'}
          {stage === 'medium' && 'Growing strong'}
          {stage === 'large' && 'Almost there'}
          {stage === 'complete' && 'Fully grown!'}
        </div>
      </div>
    </Card>
  );
};

export default GrowthAnimation;
