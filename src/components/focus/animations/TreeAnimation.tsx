
import React from 'react';
import { cn } from '@/lib/utils';

interface TreeAnimationProps {
  progress: number;
  isActive: boolean;
}

const TreeAnimation: React.FC<TreeAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

  const getTrunkHeight = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(20, 20 + (progress / 100) * 60);
  };

  const getCrownSize = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(24, 24 + (progress / 100) * 56);
  };

  const getSideBranchSize = (progress: number) => {
    if (progress < 25) return 0;
    const adjustedProgress = (progress - 25) / 75;
    return Math.max(16, 16 + adjustedProgress * 32);
  };

  const getAnimationClass = (baseClass: string) => {
    return cn(
      baseClass,
      "transition-all duration-500 ease-out",
      isActive && safeProgress > 0 && "animate-pulse"
    );
  };

  const stage = safeProgress === 0 ? 'seed' : safeProgress < 100 ? 'growing' : 'complete';

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

export default TreeAnimation;
