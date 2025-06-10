
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
    return Math.max(20, 20 + adjustedProgress * 50 * multiplier);
  };

  return (
    <>
      {/* First layer of background trees */}
      {progress >= 20 && (
        <>
          {/* Left Side Background Tree */}
          <motion.div 
            className="absolute bottom-12 opacity-60"
            style={{ left: '10%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-600 to-green-800 rounded-full mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 20, 1.0)}px`,
                height: `${getBackgroundTreeSize(progress, 20, 1.2)}px`
              }}
              animate={{
                rotate: isActive ? [-1, 1, -1] : 0
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-2 bg-amber-700 rounded-b-lg mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 20, 0.8)}px`
              }}
            />
          </motion.div>

          {/* Right Side Background Tree */}
          <motion.div 
            className="absolute bottom-12 opacity-50"
            style={{ right: '10%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-600 to-green-800 rounded-full mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 20, 1.1)}px`,
                height: `${getBackgroundTreeSize(progress, 20, 1.3)}px`
              }}
              animate={{
                rotate: isActive ? [1, -1, 1] : 0
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-2 bg-amber-700 rounded-b-lg mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 20, 0.9)}px`
              }}
            />
          </motion.div>
        </>
      )}

      {/* Second layer of background trees */}
      {progress >= 40 && (
        <>
          <motion.div 
            className="absolute bottom-12 opacity-35"
            style={{ left: '30%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            transition={{ delay: 0.7, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-700 to-green-900 rounded-full mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 40, 0.9)}px`,
                height: `${getBackgroundTreeSize(progress, 40, 1.1)}px`
              }}
              animate={{
                rotate: isActive ? [-0.5, 0.5, -0.5] : 0
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1.5 bg-amber-800 rounded-b-lg mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 40, 0.7)}px`
              }}
            />
          </motion.div>

          <motion.div 
            className="absolute bottom-12 opacity-40"
            style={{ right: '30%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ delay: 0.9, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-700 to-green-900 rounded-full mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 40, 1.0)}px`,
                height: `${getBackgroundTreeSize(progress, 40, 1.2)}px`
              }}
              animate={{
                rotate: isActive ? [0.5, -0.5, 0.5] : 0
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1.5 bg-amber-800 rounded-b-lg mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 40, 0.8)}px`
              }}
            />
          </motion.div>
        </>
      )}

      {/* Third layer of background trees */}
      {progress >= 60 && (
        <>
          <motion.div 
            className="absolute bottom-12 opacity-45"
            style={{ left: '70%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ delay: 1.1, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-600 to-green-800 rounded-full mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 60, 0.8)}px`,
                height: `${getBackgroundTreeSize(progress, 60, 1.0)}px`
              }}
              animate={{
                rotate: isActive ? [-1, 1, -1] : 0
              }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1.5 bg-amber-700 rounded-b-lg mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 60, 0.6)}px`
              }}
            />
          </motion.div>

          <motion.div 
            className="absolute bottom-12 opacity-40"
            style={{ left: '20%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ delay: 1.3, type: "spring" }}
          >
            <motion.div 
              className="bg-gradient-to-b from-green-600 to-green-800 rounded-full mb-1"
              style={{
                width: `${getBackgroundTreeSize(progress, 60, 0.9)}px`,
                height: `${getBackgroundTreeSize(progress, 60, 1.1)}px`
              }}
              animate={{
                rotate: isActive ? [1, -1, 1] : 0
              }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div 
              className="w-1.5 bg-amber-700 rounded-b-lg mx-auto"
              style={{
                height: `${getBackgroundTreeSize(progress, 60, 0.7)}px`
              }}
            />
          </motion.div>
        </>
      )}
    </>
  );
};

export default BackgroundTrees;
