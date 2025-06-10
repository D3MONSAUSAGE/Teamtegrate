
import React from 'react';
import { motion, useAnimation } from 'framer-motion';

interface FramerCityAnimationProps {
  progress: number;
  isActive: boolean;
}

const FramerCityAnimation: React.FC<FramerCityAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const controls = useAnimation();

  const getBuildingCount = (progress: number) => {
    return Math.min(6, Math.floor(progress / 15));
  };

  const getBuildingHeight = (progress: number, index: number) => {
    const baseHeight = 20;
    const progressFactor = (progress - (index * 15)) / 15;
    const adjustedProgress = Math.max(0, Math.min(1, progressFactor));
    return baseHeight + adjustedProgress * (40 + index * 10);
  };

  const stage = safeProgress === 0 ? 'empty' : safeProgress < 100 ? 'building' : 'metropolis';

  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        y: [0, -2, 0],
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    } else {
      controls.stop();
    }
  }, [isActive, safeProgress, controls]);

  const buildingColors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600', 
    'from-indigo-400 to-indigo-600',
    'from-cyan-400 to-cyan-600',
    'from-teal-400 to-teal-600',
    'from-sky-400 to-sky-600'
  ];

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* City ground */}
      <motion.div 
        className="absolute bottom-0 w-full h-6 bg-gradient-to-r from-gray-300/40 to-gray-400/40 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Road markings */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute top-2 w-4 h-0.5 bg-yellow-300 rounded-full"
            style={{
              left: `${10 + i * 12}%`,
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scaleX: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
          />
        ))}
      </motion.div>
      
      {/* Buildings Container */}
      <motion.div 
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-end justify-center gap-2"
        animate={controls}
      >
        {Array.from({ length: getBuildingCount(safeProgress) }, (_, i) => (
          <motion.div
            key={i}
            className={`bg-gradient-to-t ${buildingColors[i]} rounded-t-lg relative overflow-hidden`}
            style={{
              width: '24px',
              height: `${getBuildingHeight(safeProgress, i)}px`,
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: getBuildingHeight(safeProgress, i),
              opacity: 1
            }}
            transition={{
              height: { type: "spring", stiffness: 80, damping: 15, delay: i * 0.2 },
              opacity: { duration: 0.5, delay: i * 0.2 }
            }}
          >
            {/* Building windows */}
            {Array.from({ length: Math.floor(getBuildingHeight(safeProgress, i) / 15) }, (_, windowRow) => (
              <div key={windowRow} className="flex justify-center gap-1 mt-2">
                {Array.from({ length: 2 }, (_, windowCol) => (
                  <motion.div
                    key={windowCol}
                    className="w-1.5 h-1.5 bg-yellow-300 rounded-sm"
                    animate={{
                      opacity: isActive ? [1, 0.3, 1] : [0.7, 1, 0.7],
                      boxShadow: isActive 
                        ? ['0 0 2px rgba(253, 224, 71, 0.5)', '0 0 8px rgba(253, 224, 71, 0.8)', '0 0 2px rgba(253, 224, 71, 0.5)']
                        : 'none'
                    }}
                    transition={{
                      duration: 2 + (windowRow + windowCol) * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: (windowRow + windowCol) * 0.1
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Building antenna/details */}
            {i % 2 === 0 && getBuildingHeight(safeProgress, i) > 40 && (
              <motion.div
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-red-400 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.2 + 0.5, type: "spring" }}
              >
                <motion.div
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"
                  animate={{
                    scale: isActive ? [1, 1.3, 1] : 1,
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Sky effects for metropolis stage */}
      {stage === 'metropolis' && (
        <motion.div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
        >
          <div className="flex gap-2">
            {['🌟', '✨', '🏙️', '✨', '🌟'].map((emoji, i) => (
              <motion.div
                key={i}
                className="text-sm"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.7, 1, 0.7],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Flying elements */}
      {safeProgress >= 60 && (
        <motion.div
          className="absolute top-16 right-12 text-xs opacity-70"
          animate={{
            x: [0, -40, 0],
            y: [0, -5, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ✈️
        </motion.div>
      )}
    </div>
  );
};

export default FramerCityAnimation;
