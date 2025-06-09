
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AnimationController from './animations/AnimationController';
import EnhancedParticleSystem from './animations/EnhancedParticleSystem';
import { getGrowthStage, getStageMessage } from './animations/GrowthStageUtils';
import { MILESTONE_PERCENTAGES, shouldReduceMotion } from './animations/AnimationUtils';

interface GrowthAnimationRefactoredProps {
  progress: number; // 0-100
  animationType: 'tree' | 'flower' | 'city';
  isActive: boolean;
}

const GrowthAnimationRefactored: React.FC<GrowthAnimationRefactoredProps> = ({
  progress,
  animationType,
  isActive
}) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const stage = getGrowthStage(safeProgress);
  const reducedMotion = shouldReduceMotion();
  const isMilestone = MILESTONE_PERCENTAGES.some(milestone => milestone === safeProgress);

  return (
    <Card className="p-6 glass-card overflow-hidden relative">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Growth Progress</h3>
        <p className="text-sm text-muted-foreground">
          Watch your {animationType} grow as you stay focused
        </p>
      </div>

      <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
        <AnimationController 
          progress={safeProgress}
          animationType={animationType}
          isActive={isActive}
        />

        {/* Enhanced Particle System */}
        <EnhancedParticleSystem 
          isActive={isActive} 
          stage={stage} 
          theme={animationType}
          progress={safeProgress}
          intensity={safeProgress < 30 ? 'low' : safeProgress < 70 ? 'medium' : 'high'}
        />
        
        {/* Enhanced Milestone Celebrations */}
        {isMilestone && isActive && !reducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className="w-16 h-16 rounded-full bg-yellow-400 opacity-75 milestone-celebration"
                style={{
                  boxShadow: '0 0 40px #facc15, 0 0 80px #facc15'
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-bounce">
                ⭐
              </div>
            </div>
            
            {/* Confetti burst */}
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5],
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 22.5}deg) translateY(-80px)`,
                  animation: `celebration-burst 1.5s ease-out`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <div className={cn(
          "text-2xl font-bold transition-all duration-500 mb-2",
          isActive ? "text-primary animate-pulse" : "text-foreground",
          !reducedMotion && isActive && "drop-shadow-lg"
        )}>
          {safeProgress}%
        </div>
        <div className={cn(
          "text-sm text-muted-foreground transition-all duration-300",
          isActive && "text-primary/80"
        )}>
          {getStageMessage(stage)}
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="mt-3 w-full bg-muted/30 rounded-full h-3 overflow-hidden relative">
          <div 
            className={cn(
              "h-full transition-all duration-700 ease-out rounded-full relative",
              isActive ? "bg-gradient-to-r from-primary to-primary/70" : "bg-muted-foreground/50"
            )}
            style={{ 
              width: `${safeProgress}%`,
              ...(isActive && !reducedMotion ? {
                boxShadow: '0 0 15px currentColor',
                filter: 'brightness(1.1)'
              } : {})
            }}
          >
            {/* Progress shimmer effect */}
            {isActive && !reducedMotion && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'shimmer 2s infinite',
                  transform: 'translateX(-100%)'
                }}
              />
            )}
          </div>
          
          {/* Milestone markers */}
          {MILESTONE_PERCENTAGES.slice(0, 3).map((milestone) => (
            <div
              key={milestone}
              className={cn(
                "absolute top-0 w-0.5 h-full bg-primary/30 transition-all duration-300",
                safeProgress >= milestone && "bg-primary/60"
              )}
              style={{ left: `${milestone}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default GrowthAnimationRefactored;
