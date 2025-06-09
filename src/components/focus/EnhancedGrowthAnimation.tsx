
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ForestTheme from './animations/ForestTheme';
import GardenTheme from './animations/GardenTheme';
import CityTheme from './animations/CityTheme';
import OceanTheme from './animations/OceanTheme';
import SpaceTheme from './animations/SpaceTheme';
import ParticleSystem from './animations/ParticleSystem';

interface EnhancedGrowthAnimationProps {
  progress: number; // 0-100
  animationType: 'forest' | 'garden' | 'city' | 'ocean' | 'space';
  isActive: boolean;
  timeOfDay?: 'morning' | 'noon' | 'evening' | 'night';
}

const EnhancedGrowthAnimation: React.FC<EnhancedGrowthAnimationProps> = ({
  progress,
  animationType,
  isActive,
  timeOfDay = 'noon'
}) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  
  const getGrowthStage = (progress: number) => {
    if (progress === 0) return 'seed';
    if (progress < 15) return 'sprout';
    if (progress < 30) return 'small';
    if (progress < 50) return 'growing';
    if (progress < 70) return 'developing';
    if (progress < 85) return 'maturing';
    if (progress < 100) return 'flourishing';
    return 'magnificent';
  };

  const stage = getGrowthStage(safeProgress);
  
  const renderTheme = () => {
    const commonProps = {
      progress: safeProgress,
      stage,
      isActive,
      timeOfDay
    };

    switch (animationType) {
      case 'garden':
        return <GardenTheme {...commonProps} />;
      case 'city':
        return <CityTheme {...commonProps} />;
      case 'ocean':
        return <OceanTheme {...commonProps} />;
      case 'space':
        return <SpaceTheme {...commonProps} />;
      default:
        return <ForestTheme {...commonProps} />;
    }
  };

  const getStageMessage = () => {
    const messages = {
      seed: 'Ready to begin your journey',
      sprout: 'Taking your first steps',
      small: 'Building momentum',
      growing: 'Making steady progress',
      developing: 'Growing stronger',
      maturing: 'Almost there, keep going!',
      flourishing: 'Reaching new heights',
      magnificent: 'Magnificent achievement!'
    };
    return messages[stage] || 'Growing...';
  };

  const getThemeTitle = () => {
    const titles = {
      forest: 'Enchanted Forest',
      garden: 'Blooming Garden',
      city: 'Rising Metropolis',
      ocean: 'Ocean Depths',
      space: 'Cosmic Journey'
    };
    return titles[animationType] || 'Focus Journey';
  };

  return (
    <Card className="p-6 glass-card overflow-hidden relative">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">{getThemeTitle()}</h3>
        <p className="text-sm text-muted-foreground">
          Watch your world grow as you stay focused
        </p>
      </div>

      <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
        {renderTheme()}
        
        {/* Particle Effects */}
        <ParticleSystem 
          isActive={isActive} 
          stage={stage} 
          theme={animationType}
          progress={safeProgress}
        />
        
        {/* Milestone Celebrations */}
        {(safeProgress === 25 || safeProgress === 50 || safeProgress === 75 || safeProgress === 100) && isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-ping w-16 h-16 rounded-full bg-yellow-400 opacity-75"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
                ⭐
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <div className={cn(
          "text-3xl font-bold transition-colors duration-300 mb-2",
          isActive ? "text-primary" : "text-foreground"
        )}>
          {safeProgress}%
        </div>
        <div className="text-sm text-muted-foreground transition-all duration-300">
          {getStageMessage()}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-muted/30 rounded-full h-2 overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              isActive ? "bg-gradient-to-r from-primary to-primary/70" : "bg-muted-foreground/50"
            )}
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

export default EnhancedGrowthAnimation;
