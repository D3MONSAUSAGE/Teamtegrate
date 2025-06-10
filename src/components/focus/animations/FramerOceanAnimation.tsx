
import React from 'react';
import { motion, useAnimation } from 'framer-motion';

interface FramerOceanAnimationProps {
  progress: number;
  isActive: boolean;
}

const FramerOceanAnimation: React.FC<FramerOceanAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const controls = useAnimation();

  const getCoralSize = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(16, 16 + (progress / 100) * 48);
  };

  const getSeaweedHeight = (progress: number) => {
    if (progress < 20) return 0;
    const adjustedProgress = (progress - 20) / 80;
    return Math.max(8, 8 + adjustedProgress * 40);
  };

  const getFishCount = (progress: number) => {
    if (progress < 40) return 0;
    return Math.min(3, Math.floor((progress - 40) / 20));
  };

  const stage = safeProgress === 0 ? 'empty' : safeProgress < 100 ? 'growing' : 'reef';

  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        y: [0, -3, 0],
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
      {/* Ocean floor */}
      <motion.div 
        className="absolute bottom-0 w-full h-12 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Sand particles */}
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 h-1 bg-yellow-200/60 rounded-full opacity-70"
            style={{
              left: `${10 + i * 8}%`,
            }}
            animate={{
              y: [0, -2, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
      
      {/* Coral Container */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Main coral */}
        {stage !== 'empty' && (
          <motion.div 
            className="relative mb-2"
            animate={controls}
            initial={{ scale: 0, opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-t from-pink-500 to-coral-400 rounded-full relative"
              style={{
                width: `${getCoralSize(safeProgress)}px`,
                height: `${getCoralSize(safeProgress)}px`
              }}
              animate={{
                boxShadow: isActive 
                  ? ['0 0 15px rgba(236, 72, 153, 0.3)', '0 0 30px rgba(236, 72, 153, 0.6)', '0 0 15px rgba(236, 72, 153, 0.3)']
                  : '0 0 0px rgba(236, 72, 153, 0)'
              }}
              transition={{
                boxShadow: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              {/* Coral branches */}
              {safeProgress >= 30 && Array.from({ length: 6 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-gradient-to-t from-pink-400 to-orange-400 rounded-full"
                  style={{
                    width: `${getCoralSize(safeProgress) * 0.3}px`,
                    height: `${getCoralSize(safeProgress) * 0.4}px`,
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center bottom',
                    transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-${getCoralSize(safeProgress) * 0.3}px)`
                  }}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    rotate: isActive ? [0, 5, -5, 0] : 0
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
            </motion.div>
          </motion.div>
        )}
        
        {/* Seaweed */}
        {safeProgress >= 20 && Array.from({ length: 3 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-t from-green-600 to-green-400 rounded-full opacity-80"
            style={{
              width: '4px',
              height: `${getSeaweedHeight(safeProgress)}px`,
              left: i % 2 === 0 ? '-25px' : '25px',
              bottom: `${-10 + i * 8}px`,
            }}
            initial={{ height: 0 }}
            animate={{ 
              height: getSeaweedHeight(safeProgress),
              rotate: isActive ? [0, 8, -8, 0] : 0
            }}
            transition={{
              height: { type: "spring", delay: 0.2 + i * 0.1 },
              rotate: {
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </div>

      {/* Swimming fish */}
      {Array.from({ length: getFishCount(safeProgress) }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-sm opacity-80"
          style={{
            top: `${20 + i * 15}%`,
            left: `${20 + i * 20}%`,
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1
          }}
        >
          🐠
        </motion.div>
      ))}

      {/* Bubbles */}
      {safeProgress > 0 && Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-60"
          style={{
            left: `${20 + i * 8}%`,
            bottom: '20px'
          }}
          animate={{
            y: [0, -200],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.3
          }}
        />
      ))}

      {/* Completion effect */}
      {stage === 'reef' && (
        <motion.div 
          className="absolute top-8 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", delay: 1 }}
        >
          <div className="flex gap-2">
            {['🌊', '🐡', '🪸', '🐡', '🌊'].map((emoji, i) => (
              <motion.div
                key={i}
                className="text-sm"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2.5 + i * 0.3,
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
    </div>
  );
};

export default FramerOceanAnimation;
