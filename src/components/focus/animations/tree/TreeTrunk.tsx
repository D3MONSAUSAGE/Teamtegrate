
import React from 'react';
import { motion } from 'framer-motion';

interface TreeTrunkProps {
  progress: number;
  isActive: boolean;
  stage: 'seed' | 'growing' | 'complete';
}

const TreeTrunk: React.FC<TreeTrunkProps> = ({ progress, isActive, stage }) => {
  const getTrunkHeight = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(24, 24 + (progress / 100) * 40);
  };

  return (
    <motion.div 
      className="bg-gradient-to-t from-amber-800 via-amber-700 to-amber-600 relative shadow-lg"
      style={{
        width: '12px',
        height: stage === 'seed' ? '0px' : `${getTrunkHeight(progress)}px`,
        borderRadius: '0 0 20% 20%',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
      }}
      initial={{ height: 0 }}
      animate={{ 
        height: stage === 'seed' ? 0 : getTrunkHeight(progress),
        scaleX: isActive ? [1, 1.03, 1] : 1
      }}
      transition={{
        height: { type: "spring", stiffness: 120, damping: 25 },
        scaleX: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {/* Natural bark texture */}
      {progress > 15 && (
        <>
          <motion.div 
            className="absolute left-0.5 top-3 w-0.5 h-3 bg-amber-900 opacity-60"
            style={{
              borderRadius: '50%'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5 }}
          />
          <motion.div 
            className="absolute right-0.5 top-6 w-0.5 h-2 bg-amber-900 opacity-60"
            style={{
              borderRadius: '50%'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.7 }}
          />
          {/* Additional bark details */}
          <div className="absolute inset-x-0 bottom-1 h-1 bg-amber-900/30 rounded-full" />
        </>
      )}
    </motion.div>
  );
};

export default TreeTrunk;
