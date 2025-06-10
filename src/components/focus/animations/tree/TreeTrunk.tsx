
import React from 'react';
import { motion } from 'framer-motion';

interface TreeTrunkProps {
  progress: number;
  isActive: boolean;
  stage: 'seed' | 'growing' | 'complete';
}

const TreeTrunk: React.FC<TreeTrunkProps> = ({ progress, isActive, stage }) => {
  const getTrunkHeight = (progress: number, multiplier: number = 1) => {
    if (progress === 0) return 0;
    return Math.max(20, 20 + (progress / 100) * 60 * multiplier);
  };

  return (
    <motion.div 
      className="bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg relative border-x-2 border-amber-800 shadow-lg"
      style={{
        width: '16px',
        height: stage === 'seed' ? '0px' : `${getTrunkHeight(progress)}px`,
      }}
      initial={{ height: 0 }}
      animate={{ 
        height: stage === 'seed' ? 0 : getTrunkHeight(progress),
        scaleX: isActive ? [1, 1.05, 1] : 1
      }}
      transition={{
        height: { type: "spring", stiffness: 100, damping: 20 },
        scaleX: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {/* Bark texture */}
      {progress > 0 && (
        <>
          <motion.div 
            className="absolute left-1 top-2 w-1 h-4 bg-amber-800 rounded-full opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.5 }}
          />
          <motion.div 
            className="absolute right-1 top-6 w-1 h-3 bg-amber-800 rounded-full opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.7 }}
          />
        </>
      )}
    </motion.div>
  );
};

export default TreeTrunk;
