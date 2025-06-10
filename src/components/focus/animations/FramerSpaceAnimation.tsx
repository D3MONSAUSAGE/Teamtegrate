
import React from 'react';
import { motion, useAnimation } from 'framer-motion';

interface FramerSpaceAnimationProps {
  progress: number;
  isActive: boolean;
}

const FramerSpaceAnimation: React.FC<FramerSpaceAnimationProps> = ({ progress, isActive }) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const controls = useAnimation();

  const getPlanetSize = (progress: number) => {
    if (progress === 0) return 0;
    return Math.max(20, 20 + (progress / 100) * 60);
  };

  const getAtmosphereSize = (progress: number) => {
    if (progress < 25) return 0;
    const adjustedProgress = (progress - 25) / 75;
    return getPlanetSize(progress) + adjustedProgress * 20;
  };

  const getMoonCount = (progress: number) => {
    if (progress < 50) return 0;
    return Math.min(2, Math.floor((progress - 50) / 25));
  };

  const stage = safeProgress === 0 ? 'void' : safeProgress < 100 ? 'forming' : 'system';

  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        rotate: [0, 360],
        transition: {
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }
      });
    } else {
      controls.stop();
    }
  }, [isActive, safeProgress, controls]);

  return (
    <div className="relative w-full h-80 overflow-hidden bg-gradient-to-b from-purple-900 to-indigo-900">
      {/* Stars background */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      ))}

      {/* Nebula effect */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 30% 40%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Planet Container */}
      <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
        {/* Main planet */}
        {stage !== 'void' && (
          <motion.div 
            className="relative"
            animate={controls}
            initial={{ scale: 0, opacity: 0 }}
          >
            {/* Planet atmosphere */}
            {safeProgress >= 25 && (
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
                style={{
                  width: `${getAtmosphereSize(safeProgress)}px`,
                  height: `${getAtmosphereSize(safeProgress)}px`,
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
                }}
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  scale: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  opacity: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            )}

            {/* Main planet body */}
            <motion.div 
              className="bg-gradient-to-br from-blue-500 via-green-500 to-brown-500 rounded-full relative overflow-hidden"
              style={{
                width: `${getPlanetSize(safeProgress)}px`,
                height: `${getPlanetSize(safeProgress)}px`
              }}
              animate={{
                boxShadow: isActive 
                  ? ['0 0 20px rgba(59, 130, 246, 0.5)', '0 0 40px rgba(59, 130, 246, 0.8)', '0 0 20px rgba(59, 130, 246, 0.5)']
                  : '0 0 10px rgba(59, 130, 246, 0.3)'
              }}
              transition={{
                boxShadow: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              {/* Planet surface details */}
              {safeProgress >= 30 && (
                <>
                  <motion.div
                    className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-green-600 rounded-full opacity-70"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  />
                  <motion.div
                    className="absolute top-1/2 right-1/4 w-1/4 h-1/4 bg-brown-600 rounded-full opacity-70"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  />
                  <motion.div
                    className="absolute bottom-1/4 left-1/3 w-1/5 h-1/5 bg-white rounded-full opacity-80"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: "spring" }}
                  />
                </>
              )}
            </motion.div>

            {/* Orbiting moons */}
            {Array.from({ length: getMoonCount(safeProgress) }, (_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 8 + i * 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  width: `${getPlanetSize(safeProgress) + 40 + i * 20}px`,
                  height: `${getPlanetSize(safeProgress) + 40 + i * 20}px`
                }}
              >
                <motion.div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-300 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Cosmic debris/asteroids */}
      {safeProgress >= 60 && Array.from({ length: 4 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gray-400 rounded-full opacity-70"
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + i * 10}%`,
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -20, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "linear",
            delay: i * 1.5
          }}
        />
      ))}

      {/* Solar flares for completion */}
      {stage === 'system' && (
        <motion.div 
          className="absolute top-4 right-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 1.2 }}
        >
          <motion.div
            className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
            animate={{
              scale: [1, 1.3, 1],
              boxShadow: [
                '0 0 20px rgba(251, 191, 36, 0.5)',
                '0 0 40px rgba(251, 191, 36, 0.8)',
                '0 0 20px rgba(251, 191, 36, 0.5)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}

      {/* Completion constellation */}
      {stage === 'system' && (
        <motion.div 
          className="absolute top-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex gap-3">
            {['⭐', '🌟', '✨', '🌟', '⭐'].map((emoji, i) => (
              <motion.div
                key={i}
                className="text-sm"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.7, 1, 0.7],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 3 + i * 0.4,
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
    </div>
  );
};

export default FramerSpaceAnimation;
