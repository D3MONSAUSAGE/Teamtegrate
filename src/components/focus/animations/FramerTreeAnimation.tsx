
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

  const getTrunkHeight = (progress: number, multiplier: number = 1) => {
    if (progress === 0) return 0;
    return Math.max(20, 20 + (progress / 100) * 60 * multiplier);
  };

  const getCrownSize = (progress: number, multiplier: number = 1) => {
    if (progress === 0) return 0;
    // Increased minimum size significantly for better visibility
    return Math.max(60, 60 + (progress / 100) * 50 * multiplier);
  };

  const getBackgroundTreeSize = (progress: number, threshold: number, multiplier: number = 0.8) => {
    if (progress < threshold) return 0;
    const adjustedProgress = (progress - threshold) / (100 - threshold);
    return Math.max(20, 20 + adjustedProgress * 50 * multiplier);
  };

  const stage = safeProgress === 0 ? 'seed' : safeProgress < 100 ? 'growing' : 'complete';

  // Debug logging
  console.log('Tree Animation Debug:', {
    progress: safeProgress,
    stage,
    crownSize: getCrownSize(safeProgress),
    isActive
  });

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
      {/* Enhanced Sky Background with Clouds */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-green-100"
        animate={{
          background: isActive 
            ? [
                'linear-gradient(to bottom, #bae6fd, #e0f2fe, #dcfce7)',
                'linear-gradient(to bottom, #dbeafe, #f0f9ff, #ecfdf5)',
                'linear-gradient(to bottom, #bae6fd, #e0f2fe, #dcfce7)'
              ]
            : 'linear-gradient(to bottom, #bae6fd, #e0f2fe, #dcfce7)'
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Animated Clouds */}
        {safeProgress >= 10 && (
          <>
            <motion.div
              className="absolute top-4 w-16 h-8 bg-white/60 rounded-full"
              style={{ left: '20%' }}
              animate={{
                x: [0, 30, 0],
                opacity: [0.6, 0.8, 0.6]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-8 w-12 h-6 bg-white/40 rounded-full"
              style={{ right: '25%' }}
              animate={{
                x: [0, -20, 0],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </>
        )}

        {/* Sun */}
        <motion.div 
          className="absolute top-6 right-8 w-10 h-10 bg-yellow-400 rounded-full shadow-lg shadow-yellow-300/50"
          animate={{
            boxShadow: isActive 
              ? [
                  '0 0 20px rgba(251, 191, 36, 0.5)',
                  '0 0 40px rgba(251, 191, 36, 0.8)',
                  '0 0 20px rgba(251, 191, 36, 0.5)'
                ]
              : '0 0 20px rgba(251, 191, 36, 0.5)'
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Enhanced Forest Ground with Texture */}
      <motion.div 
        className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-green-600 via-green-500 to-green-400 rounded-t-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Forest Floor Details */}
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-0.5 bg-green-600 rounded-t-full opacity-70"
            style={{
              left: `${8 + i * 6}%`,
              height: `${6 + Math.sin(i) * 3}px`
            }}
            animate={{
              rotate: [-2, 2, -2],
              scaleY: [1, 1.1, 1]
            }}
            transition={{
              duration: 3 + i * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.05
            }}
          />
        ))}

        {/* Forest Undergrowth */}
        {safeProgress >= 30 && Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={`bush-${i}`}
            className="absolute bottom-2 w-4 h-3 bg-green-700 rounded-full opacity-60"
            style={{
              left: `${15 + i * 12}%`,
            }}
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              y: [0, -1, 0]
            }}
            transition={{
              scale: { delay: 0.5 + i * 0.1 },
              y: {
                duration: 4 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </motion.div>

      {/* Background Forest Trees - Better positioned and sized */}
      {safeProgress >= 20 && (
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
                width: `${getBackgroundTreeSize(safeProgress, 20, 1.0)}px`,
                height: `${getBackgroundTreeSize(safeProgress, 20, 1.2)}px`
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
                height: `${getBackgroundTreeSize(safeProgress, 20, 0.8)}px`
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
                width: `${getBackgroundTreeSize(safeProgress, 20, 1.1)}px`,
                height: `${getBackgroundTreeSize(safeProgress, 20, 1.3)}px`
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
                height: `${getBackgroundTreeSize(safeProgress, 20, 0.9)}px`
              }}
            />
          </motion.div>
        </>
      )}

      {/* Additional Background Trees for Deeper Forest - Better Positioned */}
      {safeProgress >= 40 && (
        <>
          {/* Far Left Background Tree */}
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
                width: `${getBackgroundTreeSize(safeProgress, 40, 0.9)}px`,
                height: `${getBackgroundTreeSize(safeProgress, 40, 1.1)}px`
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
                height: `${getBackgroundTreeSize(safeProgress, 40, 0.7)}px`
              }}
            />
          </motion.div>

          {/* Far Right Background Tree */}
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
                width: `${getBackgroundTreeSize(safeProgress, 40, 1.0)}px`,
                height: `${getBackgroundTreeSize(safeProgress, 40, 1.2)}px`
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
                height: `${getBackgroundTreeSize(safeProgress, 40, 0.8)}px`
              }}
            />
          </motion.div>
        </>
      )}

      {/* Additional Mid-Distance Trees for More Forest Depth */}
      {safeProgress >= 60 && (
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
                width: `${getBackgroundTreeSize(safeProgress, 60, 0.8)}px`,
                height: `${getBackgroundTreeSize(safeProgress, 60, 1.0)}px`
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
                height: `${getBackgroundTreeSize(safeProgress, 60, 0.6)}px`
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
                width: `${getBackgroundTreeSize(safeProgress, 60, 0.9)}px`,
                height: `${getBackgroundTreeSize(safeProgress, 60, 1.1)}px`
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
                height: `${getBackgroundTreeSize(safeProgress, 60, 0.7)}px`
              }}
            />
          </motion.div>
        </>
      )}
      
      {/* Main Tree Container */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
        {/* Enhanced Crown with Much Better Visibility */}
        {stage !== 'seed' && (
          <motion.div 
            className="relative mb-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            {/* Main crown with much darker colors and strong border */}
            <motion.div 
              className="relative"
              style={{
                width: `${getCrownSize(safeProgress)}px`,
                height: `${getCrownSize(safeProgress)}px`,
              }}
              animate={isActive ? {
                scale: [1, 1.05, 1],
                rotate: [-1, 1, -1]
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Outer glow for visibility */}
              <div 
                className="absolute inset-0 bg-green-400 rounded-full blur-sm opacity-50"
                style={{
                  width: `${getCrownSize(safeProgress)}px`,
                  height: `${getCrownSize(safeProgress)}px`,
                }}
              />
              
              {/* Main crown with very dark colors and white border */}
              <div 
                className="relative bg-gradient-to-b from-green-700 to-green-900 rounded-full border-4 border-white shadow-2xl"
                style={{
                  width: `${getCrownSize(safeProgress)}px`,
                  height: `${getCrownSize(safeProgress)}px`,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Inner highlight for depth */}
                <div 
                  className="absolute top-2 left-2 right-2 h-1/3 bg-gradient-to-b from-green-500/40 to-transparent rounded-full"
                />
                
                {/* Texture dots for realism */}
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-green-400 rounded-full opacity-60"
                    style={{
                      top: `${20 + (i % 3) * 20}%`,
                      left: `${20 + (i % 4) * 20}%`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
            
            {/* Enhanced side branches with darker colors and borders */}
            {safeProgress >= 25 && (
              <>
                <motion.div 
                  className="absolute top-1 bg-gradient-to-b from-green-700 to-green-900 rounded-full border-2 border-white shadow-lg"
                  style={{
                    left: `-${getCrownSize(safeProgress) * 0.15}px`,
                    width: `${getCrownSize(safeProgress) * 0.6}px`,
                    height: `${getCrownSize(safeProgress) * 0.7}px`,
                  }}
                  initial={{ scale: 0, x: -20 }}
                  animate={{ 
                    scale: 1, 
                    x: 0,
                    rotate: isActive ? [-3, 3, -3] : 0
                  }}
                  transition={{
                    scale: { type: "spring", delay: 0.3 },
                    rotate: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
                <motion.div 
                  className="absolute top-1 bg-gradient-to-b from-green-700 to-green-900 rounded-full border-2 border-white shadow-lg"
                  style={{
                    right: `-${getCrownSize(safeProgress) * 0.15}px`,
                    width: `${getCrownSize(safeProgress) * 0.6}px`,
                    height: `${getCrownSize(safeProgress) * 0.7}px`,
                  }}
                  initial={{ scale: 0, x: 20 }}
                  animate={{ 
                    scale: 1, 
                    x: 0,
                    rotate: isActive ? [3, -3, 3] : 0
                  }}
                  transition={{
                    scale: { type: "spring", delay: 0.5 },
                    rotate: {
                      duration: 4.5,
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
                className="absolute left-1/2 transform -translate-x-1/2"
                style={{ top: `-${getCrownSize(safeProgress) * 0.2}px` }}
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", delay: 0.8 }}
              >
                <div className="flex gap-1">
                  {['#ec4899', '#a855f7', '#facc15'].map((color, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full border border-white shadow-lg"
                      style={{ backgroundColor: color }}
                      animate={{
                        scale: [1, 1.3, 1],
                        boxShadow: [
                          `0 0 5px ${color}`,
                          `0 0 20px ${color}`,
                          `0 0 5px ${color}`
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
          className="bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg relative border-x-2 border-amber-800 shadow-lg"
          style={{
            width: '16px',
            height: stage === 'seed' ? '0px' : `${getTrunkHeight(safeProgress)}px`,
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
          {/* Enhanced bark texture */}
          {safeProgress > 0 && (
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
      </div>

      {/* Forest Animals */}
      {safeProgress >= 50 && (
        <motion.div 
          className="absolute bottom-20 text-sm"
          style={{ right: '20%' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: [0, -4, 0]
          }}
          transition={{
            scale: { delay: 1, type: "spring" },
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          🐰
        </motion.div>
      )}

      {safeProgress >= 70 && (
        <>
          <motion.div 
            className="absolute bottom-32 text-sm"
            style={{ left: '25%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: [0, 10, 0],
              y: [0, -8, 0]
            }}
            transition={{
              scale: { delay: 1.2, type: "spring" },
              x: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              },
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            🦋
          </motion.div>

          <motion.div 
            className="absolute bottom-24 text-xs"
            style={{ left: '70%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -6, 0]
            }}
            transition={{
              scale: { delay: 1.5, type: "spring" },
              y: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            🐦
          </motion.div>
        </>
      )}

      {/* Enhanced Falling Leaves Animation */}
      {isActive && safeProgress >= 40 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute text-xs opacity-70"
              style={{
                left: `${15 + (i * 10)}%`,
                top: `${5 + (i % 3) * 10}%`,
                color: ['#f59e0b', '#ef4444', '#eab308', '#f97316'][i % 4]
              }}
              animate={{
                y: [0, 200],
                x: [0, (i % 2 === 0 ? 20 : -20)],
                rotate: [0, 360],
                opacity: [0.7, 0]
              }}
              transition={{
                duration: 6 + i * 0.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.8
              }}
            >
              🍃
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FramerTreeAnimation;
