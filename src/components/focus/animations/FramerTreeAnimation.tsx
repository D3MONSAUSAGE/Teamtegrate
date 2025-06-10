
import React from 'react';
import { cn } from '@/lib/utils';
import TreeSkyBackground from './tree/TreeSkyBackground';
import TreeGround from './tree/TreeGround';
import TreeCrown from './tree/TreeCrown';
import TreeTrunk from './tree/TreeTrunk';
import BackgroundTrees from './tree/BackgroundTrees';
import TreeAnimals from './tree/TreeAnimals';
import FallingLeaves from './tree/FallingLeaves';

interface FramerTreeAnimationProps {
  progress: number;
  isActive: boolean;
}

const FramerTreeAnimation: React.FC<FramerTreeAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const stage = safeProgress === 0 ? 'seed' : safeProgress < 100 ? 'growing' : 'complete';

  // Debug logging
  console.log('Tree Animation Debug:', {
    progress: safeProgress,
    stage,
    isActive
  });

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Sky Background with Clouds and Sun */}
      <TreeSkyBackground progress={safeProgress} isActive={isActive} />

      {/* Forest Ground */}
      <TreeGround progress={safeProgress} />

      {/* Background Forest Trees */}
      <BackgroundTrees progress={safeProgress} isActive={isActive} />
      
      {/* Main Tree Container */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
        {/* Tree Crown */}
        <TreeCrown progress={safeProgress} isActive={isActive} stage={stage} />
        
        {/* Tree Trunk */}
        <TreeTrunk progress={safeProgress} isActive={isActive} stage={stage} />
      </div>

      {/* Forest Animals */}
      <TreeAnimals progress={safeProgress} />

      {/* Falling Leaves Animation */}
      <FallingLeaves isActive={isActive} progress={safeProgress} />
    </div>
  );
};

export default FramerTreeAnimation;
