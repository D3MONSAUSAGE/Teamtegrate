
import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FramerTreeAnimationProps {
  progress: number;
  isActive: boolean;
}

const FramerTreeAnimation: React.FC<FramerTreeAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const controls = useAnimation();

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

  const stage = safeProgress === 0 ? 'seed' : safeProgress < 100 ? 'growing' : 'complete';

  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        scale: [1, 1.02, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    } else {
      controls.stop();
    }
  }, [isActive, safeProgress, controls]);

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Enhanced Ground with gradient */}
      <motion.div 
        className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-green-200/30 to-green-300/30 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated grass */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-0.5 bg-green-400 rounded-t-full opacity-60"
            style={{
              left: `${15 + i * 10}%`,
              height: `${4 + Math.sin(i) * 2}px`
            }}
            animate={{
              rotate: [-2, 2, -2],
              scaleY: [1, 1.1, 1]
            }}
            transition={{
              duration: 2 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
          />
        ))}
      </motion.div>
      
      {/* Tree Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Enhanced Crown with Framer Motion */}
        {stage !== 'seed' && (
          <motion.div 
            className="relative mb-2"
            animate={controls}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.8
            }}
          >
            {/* Main crown with physics-based growth */}
            <motion.div 
              className="bg-gradient-to-b from-green-400 to-green-600 rounded-full relative"
              style={{
                width: `${getCrownSize(safeProgress)}px`,
                height: `${getCrownSize(safeProgress)}px`
              }}
              animate={{
                boxShadow: isActive 
                  ? ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 40px rgba(34, 197, 94, 0.6)', '0 0 20px rgba(34, 197, 94, 0.3)']
                  : '0 0 0px rgba(34, 197, 94, 0)'
              }}
              transition={{
                boxShadow: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              {/* Rustling leaves effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-green-300/30 to-transparent"
                  animate={{
                    rotate: [-1, 1, -1],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
            
            {/* Animated side branches */}
            {safeProgress >= 25 && (
              <>
                <motion.div 
                  className="absolute top-1 -left-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                  style={{
                    width: `${getSideBranchSize(safeProgress)}px`,
                    height: `${getSideBranchSize(safeProgress)}px`
                  }}
                  initial={{ scale: 0, x: -10 }}
                  animate={{ 
                    scale: 1, 
                    x: 0,
                    rotate: isActive ? [-2, 2, -2] : 0
                  }}
                  transition={{
                    scale: { type: "spring", delay: 0.3 },
                    rotate: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
                <motion.div 
                  className="absolute top-1 -right-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                  style={{
                    width: `${getSideBranchSize(safeProgress)}px`,
                    height: `${getSideBranchSize(safeProgress)}px`
                  }}
                  initial={{ scale: 0, x: 10 }}
                  animate={{ 
                    scale: 1, 
                    x: 0,
                    rotate: isActive ? [2, -2, 2] : 0
                  }}
                  transition={{
                    scale: { type: "spring", delay: 0.5 },
                    rotate: {
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
              </>
            )}
            
            {/* Blooming flowers for complete stage */}
            {stage === 'complete' && (
              <motion.div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", delay: 0.8 }}
              >
                <div className="flex gap-1">
                  {['#ec4899', '#a855f7', '#facc15'].map((color, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          `0 0 0px ${color}`,
                          `0 0 15px ${color}`,
                          `0 0 0px ${color}`
                        ]
                      }}
                      transition={{
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Enhanced Trunk with growth animation */}
        <motion.div 
          className="bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg relative"
          style={{
            width: '12px',
            height: stage === 'seed' ? '0px' : `${getTrunkHeight(safeProgress)}px`
          }}
          initial={{ height: 0 }}
          animate={{ 
            height: stage === 'seed' ? 0 : getTrunkHeight(safeProgress),
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
          {/* Bark texture with subtle animation */}
          {safeProgress > 0 && (
            <>
              <motion.div 
                className="absolute left-1 top-2 w-0.5 h-4 bg-amber-800 rounded-full opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.5 }}
              />
              <motion.div 
                className="absolute right-1 top-6 w-0.5 h-3 bg-amber-800 rounded-full opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.7 }}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FramerTreeAnimation;
