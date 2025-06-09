
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AnimationController from './animations/AnimationController';
import { getGrowthStage, getStageMessage } from './animations/GrowthStageUtils';

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

  return (
    <Card className="p-6 glass-card">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Growth Progress</h3>
        <p className="text-sm text-muted-foreground">
          Watch your {animationType} grow as you stay focused
        </p>
      </div>

      <AnimationController 
        progress={safeProgress}
        animationType={animationType}
        isActive={isActive}
      />

      <div className="mt-4 text-center">
        <div className={cn(
          "text-2xl font-bold transition-colors duration-300",
          isActive ? "text-primary" : "text-foreground"
        )}>
          {safeProgress}%
        </div>
        <div className="text-sm text-muted-foreground transition-all duration-300">
          {getStageMessage(stage)}
        </div>
      </div>
    </Card>
  );
};

export default GrowthAnimationRefactored;
