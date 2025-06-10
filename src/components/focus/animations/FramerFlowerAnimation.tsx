
import React from 'react';
import { motion, useAnimation } from 'framer-motion';

interface FramerFlowerAnimationProps {
  progress: number;
  isActive: boolean;
}

const FramerFlowerAnimation: React.FC<FramerFlowerAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const controls = useAnimation();

  const getStemHeight = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(15, 15 + (progress / 100) * 50);
  };

  const getFlowerSize = (progress: number) => {
    if (progress < 30) return 0;
    const adjustedProgress = (progress - 30) / 70;
    return Math.max(20, 20 + adjustedProgress * 40);
  };

  const getLeafCount = (progress: number) => {
    if (progress < 15) return 0;
    return Math.min(4, Math.floor(progress / 20));
  };

  const stage = safeProgress === 0 ? 'seed' : safeProgress < 100 ? 'growing' : 'bloomed';

  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        scale: [1, 1.03, 1],
        rotate: [0, 1, -1, 0],
        transition: {
          duration: 3,
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
      {/* Garden ground */}
      <motion.div 
        className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-pink-200/30 to-rose-300/30 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Small garden elements */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 h-2 bg-green-300 rounded-t-full opacity-50"
            style={{
              left: `${20 + i * 12}%`,
            }}
            animate={{
              scaleY: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
      
      {/* Flower Container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Flower Head */}
        {stage !== 'seed' && safeProgress >= 30 && (
          <motion.div 
            className="relative mb-2"
            animate={controls}
            initial={{ scale: 0, opacity: 0 }}
          >
            {/* Main flower with petals */}
            <motion.div 
              className="relative"
              style={{
                width: `${getFlowerSize(safeProgress)}px`,
                height: `${getFlowerSize(safeProgress)}px`
              }}
              animate={{
                filter: isActive 
                  ? ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
                  : 'brightness(1)'
              }}
              transition={{
                filter: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              {/* Petals */}
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
                  style={{
                    width: `${getFlowerSize(safeProgress) * 0.6}px`,
                    height: `${getFlowerSize(safeProgress) * 0.3}px`,
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center bottom',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${getFlowerSize(safeProgress) * 0.2}px)`
                  }}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    rotate: isActive ? [0, 2, -2, 0] : 0
                  }}
                  transition={{
                    scale: { type: "spring", delay: 0.3 + i * 0.1 },
                    rotate: {
                      duration: 4 + i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
              ))}
              
              {/* Flower center */}
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full"
                style={{
                  width: `${getFlowerSize(safeProgress) * 0.3}px`,
                  height: `${getFlowerSize(safeProgress) * 0.3}px`
                }}
                animate={{
                  boxShadow: isActive 
                    ? ['0 0 10px rgba(251, 191, 36, 0.5)', '0 0 25px rgba(251, 191, 36, 0.8)', '0 0 10px rgba(251, 191, 36, 0.5)']
                    : '0 0 0px rgba(251, 191, 36, 0)'
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            </motion.div>
            
            {/* Blooming effect for complete stage */}
            {stage === 'bloomed' && (
              <motion.div 
                className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", delay: 1 }}
              >
                <div className="flex gap-1">
                  {['✨', '🌸', '✨'].map((emoji, i) => (
                    <motion.div
                      key={i}
                      className="text-sm"
                      animate={{
                        y: [0, -5, 0],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2
                      }}
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Leaves */}
        {safeProgress >= 15 && Array.from({ length: getLeafCount(safeProgress) }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-80"
            style={{
              width: '16px',
              height: '8px',
              left: i % 2 === 0 ? '-20px' : '20px',
              bottom: `${20 + i * 15}px`,
              transform: `rotate(${i % 2 === 0 ? -45 : 45}deg)`
            }}
            initial={{ scale: 0, x: 0 }}
            animate={{ 
              scale: 1, 
              x: 0,
              rotate: isActive ? [(i % 2 === 0 ? -45 : 45) - 5, (i % 2 === 0 ? -45 : 45) + 5, (i % 2 === 0 ? -45 : 45)] : (i % 2 === 0 ? -45 : 45)
            }}
            transition={{
              scale: { type: "spring", delay: 0.2 + i * 0.1 },
              rotate: {
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
        ))}
        
        {/* Stem */}
        <motion.div 
          className="bg-gradient-to-t from-green-600 to-green-500 rounded-lg relative"
          style={{
            width: '8px',
            height: stage === 'seed' ? '0px' : `${getStemHeight(safeProgress)}px`
          }}
          initial={{ height: 0 }}
          animate={{ 
            height: stage === 'seed' ? 0 : getStemHeight(safeProgress),
            scaleX: isActive ? [1, 1.1, 1] : 1
          }}
          transition={{
            height: { type: "spring", stiffness: 80, damping: 15 },
            scaleX: {
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      </div>
    </div>
  );
};

export default FramerFlowerAnimation;
