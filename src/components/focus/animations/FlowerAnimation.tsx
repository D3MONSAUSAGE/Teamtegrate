
import React from 'react';
import { cn } from '@/lib/utils';
import { ANIMATION_TIMINGS, EASING_CURVES, createGlowEffect, shouldReduceMotion } from './AnimationUtils';

interface FlowerAnimationProps {
  progress: number;
  isActive: boolean;
}

const FlowerAnimation: React.FC<FlowerAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const reducedMotion = shouldReduceMotion();

  const getStemHeight = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(32, 32 + (progress / 100) * 96);
  };

  const getFlowerSize = (progress: number) => {
    if (progress < 25) return 0;
    const adjustedProgress = (progress - 25) / 75;
    return Math.max(24, 24 + adjustedProgress * 48);
  };

  const getPetalCount = (progress: number) => {
    if (progress < 25) return 0;
    return Math.min(8, Math.floor(6 + (progress / 100) * 2));
  };

  const getAnimationClass = (baseClass: string) => {
    if (reducedMotion) return baseClass;
    return cn(
      baseClass,
      "transition-all ease-out",
      isActive && safeProgress > 0 && "animate-pulse"
    );
  };

  const glowIntensity = isActive ? (safeProgress / 100) * 0.6 : 0;
  const petalColors = ['#ec4899', '#f472b6', '#db2777', '#be185d', '#f97316', '#ea580c'];

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Enhanced Ground with garden soil texture */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg">
        {/* Soil particles */}
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-600 rounded-full opacity-40"
            style={{
              left: `${10 + i * 7}%`,
              top: `${20 + Math.sin(i) * 30}%`
            }}
          />
        ))}
      </div>
      
      {/* Flower Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        {/* Enhanced Stem with texture */}
        <div 
          className={getAnimationClass("bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg mx-auto relative")}
          style={{
            width: '8px',
            height: `${getStemHeight(safeProgress)}px`,
            animationDuration: ANIMATION_TIMINGS.slow,
            ...(!reducedMotion && isActive ? createGlowEffect('#16a34a', glowIntensity * 0.5) : {})
          }}
        >
          {/* Stem texture */}
          {safeProgress > 0 && (
            <div className="absolute left-0.5 top-4 w-0.5 h-8 bg-green-700 rounded-full opacity-40" />
          )}
        </div>
        
        {/* Enhanced Flower Head */}
        {safeProgress >= 25 && (
          <div className="relative">
            <div 
              className="absolute -top-2 left-1/2 transform -translate-x-1/2"
              style={{
                width: `${getFlowerSize(safeProgress)}px`,
                height: `${getFlowerSize(safeProgress)}px`
              }}
            >
              {/* Enhanced Petals with individual animations */}
              {Array.from({ length: getPetalCount(safeProgress) }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute rounded-full transition-all",
                    !reducedMotion && isActive && "animate-pulse"
                  )}
                  style={{
                    width: '10px',
                    height: '20px',
                    background: `linear-gradient(to top, ${petalColors[i % petalColors.length]}, ${petalColors[(i + 1) % petalColors.length]}40)`,
                    transform: `rotate(${i * (360 / getPetalCount(safeProgress))}deg) translateY(-50%)`,
                    transformOrigin: 'center bottom',
                    top: '50%',
                    left: '50%',
                    marginLeft: '-5px',
                    opacity: Math.min(1, (safeProgress - 25) / 75),
                    animationDuration: `${2 + i * 0.1}s`,
                    animationDelay: `${i * 0.1}s`,
                    ...(!reducedMotion && isActive ? createGlowEffect(petalColors[i % petalColors.length], glowIntensity) : {})
                  }}
                />
              ))}
              
              {/* Enhanced Center with pollen effect */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-300 relative"
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#facc15',
                  ...(!reducedMotion && isActive ? createGlowEffect('#facc15', glowIntensity) : {})
                }}
              >
                {/* Pollen particles */}
                {!reducedMotion && safeProgress >= 50 && (
                  <>
                    {Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-200 rounded-full opacity-60"
                        style={{
                          left: `${2 + i * 3}px`,
                          top: `${2 + i * 2}px`,
                          animation: `sparkle ${1 + i * 0.3}s ${EASING_CURVES.natural} infinite`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Leaves with better positioning */}
        {safeProgress >= 40 && (
          <>
            <div 
              className={getAnimationClass("absolute bottom-12 -left-4 bg-green-500 rounded-full")}
              style={{
                width: '24px',
                height: '12px',
                transform: 'rotate(45deg)',
                transformOrigin: 'bottom right',
                animationDuration: ANIMATION_TIMINGS.float,
                animationDelay: '0.3s'
              }}
            />
            <div 
              className={getAnimationClass("absolute bottom-16 -right-4 bg-green-500 rounded-full")}
              style={{
                width: '24px',
                height: '12px',
                transform: 'rotate(-45deg)',
                transformOrigin: 'bottom left',
                animationDuration: ANIMATION_TIMINGS.float,
                animationDelay: '0.6s'
              }}
            />
          </>
        )}
      </div>

      {/* Buzzing bees and butterflies */}
      {!reducedMotion && isActive && safeProgress >= 60 && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute text-sm"
            style={{
              left: '30%',
              top: '25%',
              animation: `drift ${4}s ${EASING_CURVES.natural} infinite`,
              animationDelay: '0s'
            }}
          >
            🐝
          </div>
          <div 
            className="absolute text-lg"
            style={{
              right: '25%',
              top: '35%',
              animation: `float ${3}s ${EASING_CURVES.natural} infinite alternate`,
              animationDelay: '1s'
            }}
          >
            🦋
          </div>
        </div>
      )}

      {/* Dewdrops effect for morning feel */}
      {!reducedMotion && safeProgress >= 30 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={`dew-${i}`}
              className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-60"
              style={{
                left: `${40 + (i * 8)}%`,
                top: `${50 + (i % 2) * 10}%`,
                animation: `sparkle ${2 + i * 0.5}s ${EASING_CURVES.smooth} infinite`,
                animationDelay: `${i * 0.3}s`,
                boxShadow: '0 0 4px #bfdbfe'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowerAnimation;
