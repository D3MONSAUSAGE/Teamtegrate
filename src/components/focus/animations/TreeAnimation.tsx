
import React from 'react';
import { cn } from '@/lib/utils';
import { ANIMATION_TIMINGS, EASING_CURVES, createGlowEffect, shouldReduceMotion } from './AnimationUtils';

interface TreeAnimationProps {
  progress: number;
  isActive: boolean;
}

const TreeAnimation: React.FC<TreeAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const reducedMotion = shouldReduceMotion();

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
    if (reducedMotion) return baseClass;
    return cn(
      baseClass,
      "transition-all ease-out",
      isActive && safeProgress > 0 && "animate-pulse"
    );
  };

  const stage = safeProgress === 0 ? 'seed' : safeProgress < 100 ? 'growing' : 'complete';
  const glowIntensity = isActive ? (safeProgress / 100) * 0.5 : 0;

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Enhanced Ground with texture */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg">
        {/* Grass texture */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-0.5 bg-green-400 rounded-t-full opacity-60"
            style={{
              left: `${15 + i * 10}%`,
              height: `${4 + Math.sin(i) * 2}px`,
              animation: !reducedMotion ? `sway ${2 + i * 0.2}s ${EASING_CURVES.natural} infinite alternate` : undefined,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      
      {/* Tree Container with enhanced positioning */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Enhanced Leaves/Crown */}
        {stage !== 'seed' && (
          <div className="relative mb-2">
            {/* Main crown with glow effect */}
            <div 
              className={getAnimationClass(
                "bg-gradient-to-b from-green-400 to-green-600 rounded-full"
              )}
              style={{
                width: `${getCrownSize(safeProgress)}px`,
                height: `${getCrownSize(safeProgress)}px`,
                animationDuration: ANIMATION_TIMINGS.breathe,
                ...(!reducedMotion && isActive ? createGlowEffect('#22c55e', glowIntensity) : {})
              }}
            />
            
            {/* Enhanced side branches with staggered animation */}
            {safeProgress >= 25 && (
              <>
                <div 
                  className={getAnimationClass(
                    "absolute top-1 -left-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                  )}
                  style={{
                    width: `${getSideBranchSize(safeProgress)}px`,
                    height: `${getSideBranchSize(safeProgress)}px`,
                    animationDuration: ANIMATION_TIMINGS.float,
                    animationDelay: '0.2s',
                    ...(!reducedMotion && isActive ? createGlowEffect('#16a34a', glowIntensity * 0.7) : {})
                  }}
                />
                <div 
                  className={getAnimationClass(
                    "absolute top-1 -right-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                  )}
                  style={{
                    width: `${getSideBranchSize(safeProgress)}px`,
                    height: `${getSideBranchSize(safeProgress)}px`,
                    animationDuration: ANIMATION_TIMINGS.float,
                    animationDelay: '0.4s',
                    ...(!reducedMotion && isActive ? createGlowEffect('#16a34a', glowIntensity * 0.7) : {})
                  }}
                />
              </>
            )}
            
            {/* Enhanced flowers for complete stage */}
            {stage === 'complete' && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-1">
                  {['#ec4899', '#a855f7', '#facc15'].map((color, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: color,
                        animation: !reducedMotion ? `bounce ${1.5 + i * 0.2}s ${EASING_CURVES.bounce} infinite` : undefined,
                        animationDelay: `${i * 0.2}s`,
                        ...(!reducedMotion && isActive ? createGlowEffect(color, 0.8) : {})
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced Trunk with texture */}
        <div 
          className={getAnimationClass("bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg relative")}
          style={{
            width: '12px',
            height: `${getTrunkHeight(safeProgress)}px`,
            minHeight: stage === 'seed' ? '0px' : '20px',
            animationDuration: ANIMATION_TIMINGS.slow
          }}
        >
          {/* Bark texture lines */}
          {safeProgress > 0 && (
            <>
              <div className="absolute left-1 top-2 w-0.5 h-4 bg-amber-800 rounded-full opacity-60" />
              <div className="absolute right-1 top-6 w-0.5 h-3 bg-amber-800 rounded-full opacity-60" />
            </>
          )}
        </div>
      </div>
      
      {/* Enhanced floating particles */}
      {isActive && stage !== 'seed' && !reducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-70"
              style={{
                width: `${2 + Math.sin(i) * 1}px`,
                height: `${2 + Math.sin(i) * 1}px`,
                backgroundColor: i % 2 === 0 ? '#22c55e' : '#facc15',
                left: `${20 + (i * 8)}%`,
                top: `${20 + (i % 4) * 15}%`,
                animation: `float ${2 + i * 0.3}s ${EASING_CURVES.natural} infinite alternate`,
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 0 10px ${i % 2 === 0 ? '#22c55e' : '#facc15'}`
              }}
            />
          ))}
        </div>
      )}

      {/* Wind effect - subtle leaf movement */}
      {isActive && safeProgress >= 50 && !reducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`leaf-${i}`}
              className="absolute text-green-500 opacity-60"
              style={{
                left: `${30 + (i * 20)}%`,
                top: `${10 + (i * 15)}%`,
                animation: `drift ${3 + i}s ${EASING_CURVES.natural} infinite`,
                animationDelay: `${i * 0.5}s`,
                fontSize: '8px'
              }}
            >
              🍃
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeAnimation;
