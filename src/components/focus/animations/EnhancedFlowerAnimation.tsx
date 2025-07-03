
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

  // Simplified flower types with earlier start progress
  const flowerTypes = [
    {
      id: 'flower1',
      position: { left: '15%', bottom: '20px' },
      startProgress: 10,
      color: 'from-pink-400 to-rose-500',
      centerColor: 'from-yellow-300 to-orange-400',
      petalCount: 8,
      size: 35,
      type: 'rose'
    },
    {
      id: 'flower2',
      position: { left: '35%', bottom: '30px' },
      startProgress: 30,
      color: 'from-purple-400 to-violet-500',
      centerColor: 'from-white to-yellow-200',
      petalCount: 6,
      size: 28,
      type: 'daisy'
    },
    {
      id: 'flower3',
      position: { left: '55%', bottom: '25px' },
      startProgress: 50,
      color: 'from-red-400 to-pink-500',
      centerColor: 'from-yellow-400 to-orange-500',
      petalCount: 12,
      size: 32,
      type: 'sunflower'
    },
    {
      id: 'flower4',
      position: { left: '75%', bottom: '35px' },
      startProgress: 70,
      color: 'from-blue-400 to-indigo-500',
      centerColor: 'from-white to-blue-100',
      petalCount: 10,
      size: 25,
      type: 'morning-glory'
    },
    {
      id: 'flower5',
      position: { left: '85%', bottom: '15px' },
      startProgress: 85,
      color: 'from-orange-400 to-red-500',
      centerColor: 'from-yellow-300 to-yellow-500',
      petalCount: 16,
      size: 40,
      type: 'marigold'
    }
  ];

  // Animation controls for active state
  React.useEffect(() => {
    if (isActive && safeProgress > 0) {
      controls.start({
        scale: [1, 1.02, 1],
        rotate: [0, 0.5, -0.5, 0],
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

  // Simplified stem height calculation
  const getStemHeight = (flower: any) => {
    if (safeProgress < flower.startProgress) return 0;
    const progressAfterStart = safeProgress - flower.startProgress;
    const remainingProgress = 100 - flower.startProgress;
    const growthRatio = Math.min(1, progressAfterStart / Math.max(1, remainingProgress * 0.3));
    return 20 + (growthRatio * 40);
  };

  // Simplified flower opacity - appears when stem starts growing
  const getFlowerOpacity = (flower: any) => {
    if (safeProgress < flower.startProgress + 5) return 0;
    const progressAfterStart = safeProgress - flower.startProgress - 5;
    const maxProgressForGrowth = 100 - flower.startProgress - 5;
    const opacityRatio = Math.min(1, progressAfterStart / Math.max(1, maxProgressForGrowth));
    return Math.max(0.8, opacityRatio); // Minimum 80% opacity when visible
  };

  // Simplified flower size calculation
  const getFlowerSize = (flower: any) => {
    const opacity = getFlowerOpacity(flower);
    if (opacity <= 0) return 0;
    const sizeRatio = Math.min(1, opacity * 1.2); // Scale with opacity
    return flower.size * Math.max(0.6, sizeRatio); // Minimum 60% size when visible
  };

  const renderFlower = (flower: any) => {
    const stemHeight = getStemHeight(flower);
    const flowerOpacity = getFlowerOpacity(flower);
    const flowerSize = getFlowerSize(flower);

    console.log(`Flower ${flower.id}: progress=${safeProgress}, startProgress=${flower.startProgress}, opacity=${flowerOpacity}, size=${flowerSize}`);

    return (
      <div key={flower.id} className="absolute" style={flower.position}>
        {/* Flower Head - Always render if opacity > 0 */}
        {flowerOpacity > 0 && (
          <motion.div 
            className="relative mb-2 z-20"
            animate={controls}
            style={{
              opacity: flowerOpacity,
              width: `${flowerSize}px`,
              height: `${flowerSize}px`
            }}
            initial={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            {/* Debug border to see flower bounds */}
            <div 
              className="absolute inset-0 border-2 border-red-300 border-dashed opacity-30 z-30"
              style={{ pointerEvents: 'none' }}
            />
            
            {/* Petals */}
            {Array.from({ length: flower.petalCount }, (_, i) => (
              <motion.div
                key={i}
                className={`absolute bg-gradient-to-r ${flower.color} rounded-full shadow-sm z-10`}
                style={{
                  width: `${flowerSize * 0.6}px`,
                  height: `${flowerSize * 0.3}px`,
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center bottom',
                  transform: `translate(-50%, -50%) rotate(${i * (360 / flower.petalCount)}deg) translateY(-${flowerSize * 0.2}px)`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  rotate: isActive 
                    ? [i * (360 / flower.petalCount), i * (360 / flower.petalCount) + 2, i * (360 / flower.petalCount) - 2, i * (360 / flower.petalCount)]
                    : i * (360 / flower.petalCount)
                }}
                transition={{
                  scale: { type: "spring", delay: i * 0.05, duration: 0.5 },
                  opacity: { type: "spring", delay: i * 0.05, duration: 0.5 },
                  rotate: {
                    duration: 3 + i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
            
            {/* Flower center */}
            <motion.div
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r ${flower.centerColor} rounded-full shadow-inner z-20`}
              style={{
                width: `${flowerSize * 0.25}px`,
                height: `${flowerSize * 0.25}px`
              }}
              animate={{
                boxShadow: isActive 
                  ? ['0 0 5px rgba(251, 191, 36, 0.3)', '0 0 15px rgba(251, 191, 36, 0.6)', '0 0 5px rgba(251, 191, 36, 0.3)']
                  : '0 0 0px rgba(251, 191, 36, 0)'
              }}
              transition={{
                boxShadow: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />

            {/* Floating sparkles for completed flowers */}
            {flowerOpacity >= 0.8 && (
              <motion.div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", delay: 1 }}
              >
                <div className="flex gap-1">
                  {['✨', '🌸', '✨'].map((emoji, i) => (
                    <motion.div
                      key={i}
                      className="text-xs"
                      animate={{
                        y: [0, -3, 0],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{
                        duration: 2 + i * 0.2,
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
          </motion.div>
        )}

        {/* Leaves along the stem */}
        {stemHeight > 15 && Array.from({ length: Math.min(3, Math.floor(stemHeight / 20)) }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-80 shadow-sm z-5"
            style={{
              width: '12px',
              height: '6px',
              left: i % 2 === 0 ? '-15px' : '15px',
              bottom: `${15 + i * 12}px`,
              transform: `rotate(${i % 2 === 0 ? -45 : 45}deg)`
            }}
            initial={{ scale: 0, x: 0 }}
            animate={{ 
              scale: 1, 
              x: 0,
              rotate: isActive 
                ? [(i % 2 === 0 ? -45 : 45) - 3, (i % 2 === 0 ? -45 : 45) + 3, (i % 2 === 0 ? -45 : 45)]
                : (i % 2 === 0 ? -45 : 45)
            }}
            transition={{
              scale: { type: "spring", delay: 0.3 + i * 0.1 },
              rotate: {
                duration: 2.5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
        ))}
        
        {/* Stem */}
        <motion.div 
          className="bg-gradient-to-t from-green-600 to-green-500 rounded-lg relative shadow-sm z-0"
          style={{
            width: '6px',
            height: `${stemHeight}px`
          }}
          initial={{ height: 0 }}
          animate={{ 
            height: stemHeight,
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
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Enhanced garden ground with texture */}
      <motion.div 
        className="absolute bottom-0 w-full h-12 bg-gradient-to-r from-green-200/40 via-emerald-300/40 to-green-200/40 rounded-lg shadow-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Garden bed texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-yellow-100/20 rounded-lg" />
        
        {/* Small garden path elements */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-stone-300/40 rounded-full" />
        
        {/* Small grass elements */}
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 h-3 bg-green-400/60 rounded-t-full"
            style={{
              left: `${10 + i * 7}%`,
            }}
            animate={{
              scaleY: [1, 1.1, 1],
              opacity: [0.6, 0.8, 0.6]
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

      {/* Render all flowers */}
      {flowerTypes.map(renderFlower)}

      {/* Floating garden elements */}
      {safeProgress > 60 && (
        <>
          {/* Butterflies */}
          {Array.from({ length: 2 }, (_, i) => (
            <motion.div
              key={`butterfly-${i}`}
              className="absolute text-sm z-30"
              style={{
                left: `${30 + i * 40}%`,
                top: `${30 + i * 20}%`
              }}
              animate={{
                x: [0, 20, -10, 0],
                y: [0, -10, 5, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 2
              }}
            >
              🦋
            </motion.div>
          ))}

          {/* Floating pollen particles */}
          {Array.from({ length: 4 }, (_, i) => (
            <motion.div
              key={`pollen-${i}`}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-60 shadow-sm z-25"
              style={{
                left: `${20 + i * 20}%`,
                top: `${40 + i * 10}%`
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, 5, -5, 0],
                opacity: [0.6, 1, 0.3, 0.6]
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default EnhancedFlowerAnimation;
