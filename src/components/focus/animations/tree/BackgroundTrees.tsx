
import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundTreesProps {
  progress: number;
  isActive: boolean;
}

const BackgroundTrees: React.FC<BackgroundTreesProps> = ({ progress, isActive }) => {
  const getBackgroundTreeSize = (progress: number, threshold: number, multiplier: number = 0.8) => {
    if (progress < threshold) return 0;
    const adjustedProgress = (progress - threshold) / (100 - threshold);
    return Math.max(15, 15 + adjustedProgress * 35 * multiplier);
  };

  return (
    <>
      {/* First layer - closer background trees */}
      {progress >= 20 && (
        <>
          <motion.div 
            className="absolute bottom-12 opacity-50"
            style={{ left: '15%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-500 to-green-700 mb-1 shadow-sm"
              style={{
                width: `${getBackgroundTreeSize(progress, 20, 1.0)}px`,
                height: `${getBackgroundTreeSize(progress, 20, 1.1)}px`,
                borderRadius: '60% 40% 50% 70% / 50% 60% 40% 50%'
              }}
              animate={{
                rotate: isActive ? [-0.8, 0.8, -0.8] : 0
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-2 bg-amber-800 mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 20, 0.7)}px`,
                borderRadius: '0 0 20% 20%'
              }}
            />
          </motion.div>

          <motion.div 
            className="absolute bottom-12 opacity-45"
            style={{ right: '15%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-500 to-green-700 mb-1 shadow-sm"
              style={{
                width: `${getBackgroundTreeSize(progress, 20, 0.9)}px`,
                height: `${getBackgroundTreeSize(progress, 20, 1.2)}px`,
                borderRadius: '40% 60% 70% 30% / 60% 40% 50% 70%'
              }}
              animate={{
                rotate: isActive ? [0.8, -0.8, 0.8] : 0
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-2 bg-amber-800 mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 20, 0.8)}px`,
                borderRadius: '0 0 20% 20%'
              }}
            />
          </motion.div>
        </>
      )}

      {/* Second layer - distant background trees */}
      {progress >= 40 && (
        <>
          <motion.div 
            className="absolute bottom-12 opacity-30"
            style={{ left: '35%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ delay: 0.7, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-600 to-green-800 mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 40, 0.8)}px`,
                height: `${getBackgroundTreeSize(progress, 40, 1.0)}px`,
                borderRadius: '50% 50% 60% 40% / 40% 60% 50% 50%'
              }}
              animate={{
                rotate: isActive ? [-0.4, 0.4, -0.4] : 0
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1.5 bg-amber-900 mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 40, 0.6)}px`,
                borderRadius: '0 0 20% 20%'
              }}
            />
          </motion.div>

          <motion.div 
            className="absolute bottom-12 opacity-35"
            style={{ right: '30%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            transition={{ delay: 0.9, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-600 to-green-800 mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 40, 0.9)}px`,
                height: `${getBackgroundTreeSize(progress, 40, 1.1)}px`,
                borderRadius: '70% 30% 40% 60% / 30% 70% 60% 40%'
              }}
              animate={{
                rotate: isActive ? [0.4, -0.4, 0.4] : 0
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1.5 bg-amber-900 mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 40, 0.7)}px`,
                borderRadius: '0 0 20% 20%'
              }}
            />
          </motion.div>
        </>
      )}

      {/* Third layer - very distant trees */}
      {progress >= 60 && (
        <>
          <motion.div 
            className="absolute bottom-12 opacity-25"
            style={{ left: '65%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.25 }}
            transition={{ delay: 1.1, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-700 to-green-900 mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 60, 0.7)}px`,
                height: `${getBackgroundTreeSize(progress, 60, 0.9)}px`,
                borderRadius: '60% 40% 50% 50% / 50% 50% 40% 60%'
              }}
              animate={{
                rotate: isActive ? [-0.3, 0.3, -0.3] : 0
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1 bg-amber-900 mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 60, 0.5)}px`,
                borderRadius: '0 0 20% 20%'
              }}
            />
          </motion.div>

          <motion.div 
            className="absolute bottom-12 opacity-20"
            style={{ left: '25%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ delay: 1.3, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-700 to-green-900 mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 60, 0.8)}px`,
                height: `${getBackgroundTreeSize(progress, 60, 1.0)}px`,
                borderRadius: '40% 60% 60% 40% / 60% 40% 40% 60%'
              }}
              animate={{
                rotate: isActive ? [0.3, -0.3, 0.3] : 0
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1 bg-amber-900 mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 60, 0.6)}px`,
                borderRadius: '0 0 20% 20%'
              }}
            />
          </motion.div>
        </>
      )}
    </>
  );
};

export default BackgroundTrees;
