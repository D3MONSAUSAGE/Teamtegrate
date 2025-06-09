
import React from 'react';
import { cn } from '@/lib/utils';

interface CityAnimationSimpleProps {
  progress: number;
  isActive: boolean;
}

const CityAnimationSimple: React.FC<CityAnimationSimpleProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

  const getBuildingHeight = (progress: number, maxHeight: number) => {
    if (progress === 0) return 0;
    return Math.max(8, (progress / 100) * maxHeight);
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

export default CityAnimationSimple;
