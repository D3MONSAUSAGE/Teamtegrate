
import React from 'react';
import { motion, useAnimation } from 'framer-motion';

interface EnhancedFlowerAnimationProps {
  progress: number;
  isActive: boolean;
}

const EnhancedFlowerAnimation: React.FC<EnhancedFlowerAnimationProps> = ({ 
  progress, 
  isActive 
}) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const controls = useAnimation();

  // Elegant flower garden with better spacing and colors
  const flowerTypes = [
    {
      id: 'flower1',
      position: { left: '20%', bottom: '25px' },
      startProgress: 15,
      color: 'from-pink-300 to-rose-400',
      centerColor: 'from-yellow-200 to-orange-300',
      petalCount: 8,
      size: 32,
      type: 'rose'
    },
    {
      id: 'flower2',
      position: { left: '40%', bottom: '35px' },
      startProgress: 35,
      color: 'from-purple-300 to-violet-400',
      centerColor: 'from-white to-yellow-100',
      petalCount: 6,
      size: 26,
      type: 'daisy'
    },
    {
      id: 'flower3',
      position: { left: '60%', bottom: '20px' },
      startProgress: 55,
      color: 'from-blue-300 to-indigo-400',
      centerColor: 'from-white to-blue-50',
      petalCount: 10,
      size: 28,
      type: 'morning-glory'
    },
    {
      id: 'flower4',
      position: { left: '80%', bottom: '30px' },
      startProgress: 75,
      color: 'from-orange-300 to-red-400',
      centerColor: 'from-yellow-200 to-yellow-400',
      petalCount: 12,
      size: 35,
      type: 'marigold'
    }
  ];

  // Animation controls for active state
  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        scale: [1, 1.01, 1],
        rotate: [0, 0.3, -0.3, 0],
        transition: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    } else {
      controls.stop();
    }
  }, [isActive, safeProgress, controls]);

  // Clean stem height calculation
  const getStemHeight = (flower: any) => {
    if (safeProgress < flower.startProgress) return 0;
    const progressAfterStart = safeProgress - flower.startProgress;
    const growthWindow = 25; // Flowers fully grow over 25% progress
    const growthRatio = Math.min(1, progressAfterStart / growthWindow * 0.8);
    return 25 + (growthRatio * 45);
  };

  // Simple flower visibility - appears when progress reaches threshold
  const isFlowerVisible = (flower: any) => {
    return safeProgress >= flower.startProgress + 8;
  };

  // Clean flower size calculation
  const getFlowerSize = (flower: any) => {
    if (!isFlowerVisible(flower)) return 0;
    
    const progressAfterVisible = safeProgress - (flower.startProgress + 8);
    const sizeGrowthWindow = 15; // Size grows over 15% progress
    const sizeRatio = Math.min(1, progressAfterVisible / sizeGrowthWindow);
    
    return flower.size * (0.4 + sizeRatio * 0.6);
  };

  const renderFlower = (flower: any) => {
    const stemHeight = getStemHeight(flower);
    const flowerVisible = isFlowerVisible(flower);
    const flowerSize = getFlowerSize(flower);

    return (
      <div key={flower.id} className="absolute" style={flower.position}>
        {/* Flower Head */}
        {flowerVisible && (
          <motion.div 
            className="relative mb-2 z-20"
            animate={controls}
            style={{
              width: `${flowerSize}px`,
              height: `${flowerSize}px`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8, ease: "easeOut" }}
          >
            {/* Petals */}
            {Array.from({ length: flower.petalCount }, (_, i) => (
              <motion.div
                key={i}
                className={`absolute bg-gradient-to-r ${flower.color} rounded-full shadow-sm`}
                style={{
                  width: `${flowerSize * 0.55}px`,
                  height: `${flowerSize * 0.25}px`,
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center bottom',
                  transform: `translate(-50%, -50%) rotate(${i * (360 / flower.petalCount)}deg) translateY(-${flowerSize * 0.18}px)`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  rotate: isActive 
                    ? [i * (360 / flower.petalCount), i * (360 / flower.petalCount) + 1, i * (360 / flower.petalCount) - 1, i * (360 / flower.petalCount)]
                    : i * (360 / flower.petalCount)
                }}
                transition={{
                  scale: { type: "spring", delay: i * 0.03, duration: 0.6 },
                  opacity: { type: "spring", delay: i * 0.03, duration: 0.6 },
                  rotate: {
                    duration: 4 + i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
            
            {/* Flower center */}
            <motion.div
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r ${flower.centerColor} rounded-full shadow-inner`}
              style={{
                width: `${flowerSize * 0.2}px`,
                height: `${flowerSize * 0.2}px`
              }}
              animate={{
                boxShadow: isActive 
                  ? ['0 0 3px rgba(251, 191, 36, 0.2)', '0 0 8px rgba(251, 191, 36, 0.4)', '0 0 3px rgba(251, 191, 36, 0.2)']
                  : '0 0 0px rgba(251, 191, 36, 0)'
              }}
              transition={{
                boxShadow: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />

            {/* Subtle sparkles for fully bloomed flowers */}
            {flowerSize >= flower.size * 0.85 && (
              <motion.div 
                className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                initial={{ scale: 0, y: 5 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", delay: 1.2 }}
              >
                <motion.div
                  className="text-xs opacity-70"
                  animate={{
                    y: [0, -2, 0],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ✨
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Leaves along the stem - fewer and more natural */}
        {stemHeight > 20 && Array.from({ length: Math.min(2, Math.floor(stemHeight / 25)) }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-green-300 to-green-500 rounded-full opacity-70 shadow-sm"
            style={{
              width: '10px',
              height: '5px',
              left: i % 2 === 0 ? '-12px' : '12px',
              bottom: `${20 + i * 15}px`,
              transform: `rotate(${i % 2 === 0 ? -35 : 35}deg)`
            }}
            initial={{ scale: 0, x: 0 }}
            animate={{ 
              scale: 1, 
              x: 0,
              rotate: isActive 
                ? [(i % 2 === 0 ? -35 : 35) - 2, (i % 2 === 0 ? -35 : 35) + 2, (i % 2 === 0 ? -35 : 35)]
                : (i % 2 === 0 ? -35 : 35)
            }}
            transition={{
              scale: { type: "spring", delay: 0.4 + i * 0.1 },
              rotate: {
                duration: 3 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
        ))}
        
        {/* Stem */}
        <motion.div 
          className="bg-gradient-to-t from-green-500 to-green-400 rounded-lg relative shadow-sm"
          style={{
            width: '5px',
            height: `${stemHeight}px`
          }}
          initial={{ height: 0 }}
          animate={{ 
            height: stemHeight,
            scaleX: isActive ? [1, 1.03, 1] : 1
          }}
          transition={{
            height: { type: "spring", stiffness: 80, damping: 15 },
            scaleX: {
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Clean garden ground */}
      <motion.div 
        className="absolute bottom-0 w-full h-10 bg-gradient-to-r from-green-100/60 via-emerald-200/60 to-green-100/60 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Garden bed texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 to-yellow-50/30 rounded-lg" />
        
        {/* Subtle grass elements */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 h-2 bg-green-300/50 rounded-t-full"
            style={{
              left: `${15 + i * 10}%`,
            }}
            animate={{
              scaleY: [1, 1.05, 1],
              opacity: [0.5, 0.7, 0.5]
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

      {/* Progress indicator */}
      <div className="absolute top-4 left-4 bg-white/70 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
        {safeProgress}%
      </div>

      {/* Render all flowers */}
      {flowerTypes.map(renderFlower)}

      {/* Subtle floating elements for completed garden */}
      {safeProgress > 80 && (
        <>
          {/* Single butterfly */}
          <motion.div
            className="absolute text-sm z-30 opacity-60"
            style={{
              left: '45%',
              top: '25%'
            }}
            animate={{
              x: [0, 15, -8, 0],
              y: [0, -8, 3, 0],
              rotate: [0, 3, -3, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🦋
          </motion.div>

          {/* Gentle pollen particles */}
          {Array.from({ length: 2 }, (_, i) => (
            <motion.div
              key={`pollen-${i}`}
              className="absolute w-1 h-1 bg-yellow-200 rounded-full opacity-40"
              style={{
                left: `${30 + i * 25}%`,
                top: `${45 + i * 10}%`
              }}
              animate={{
                y: [0, -10, 0],
                x: [0, 3, -3, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.2
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default EnhancedFlowerAnimation;
