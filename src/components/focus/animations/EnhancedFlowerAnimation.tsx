
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

  // Clean flower garden with better spacing and colors
  const flowerTypes = [
    {
      id: 'flower1',
      position: { left: '25%', bottom: '25px' },
      startProgress: 20,
      color: 'from-pink-400 to-rose-500',
      centerColor: 'from-yellow-200 to-orange-300',
      petalCount: 8,
      size: 28,
      type: 'rose'
    },
    {
      id: 'flower2',
      position: { left: '50%', bottom: '30px' },
      startProgress: 45,
      color: 'from-purple-400 to-violet-500',
      centerColor: 'from-white to-yellow-100',
      petalCount: 6,
      size: 24,
      type: 'daisy'
    },
    {
      id: 'flower3',
      position: { left: '75%', bottom: '20px' },
      startProgress: 70,
      color: 'from-blue-400 to-indigo-500',
      centerColor: 'from-white to-blue-50',
      petalCount: 10,
      size: 26,
      type: 'morning-glory'
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
    const growthWindow = 20;
    const growthRatio = Math.min(1, progressAfterStart / growthWindow);
    return 20 + (growthRatio * 40);
  };

  // Simple flower visibility
  const isFlowerVisible = (flower: any) => {
    return safeProgress >= flower.startProgress + 5;
  };

  // Clean flower size calculation
  const getFlowerSize = (flower: any) => {
    if (!isFlowerVisible(flower)) return 0;
    
    const progressAfterVisible = safeProgress - (flower.startProgress + 5);
    const sizeGrowthWindow = 15;
    const sizeRatio = Math.min(1, progressAfterVisible / sizeGrowthWindow);
    
    return flower.size * (0.5 + sizeRatio * 0.5);
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
                  width: `${flowerSize * 0.5}px`,
                  height: `${flowerSize * 0.2}px`,
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center bottom',
                  transform: `translate(-50%, -50%) rotate(${i * (360 / flower.petalCount)}deg) translateY(-${flowerSize * 0.15}px)`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1
                }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.6,
                  type: "spring"
                }}
              />
            ))}
            
            {/* Flower center */}
            <motion.div
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r ${flower.centerColor} rounded-full shadow-inner`}
              style={{
                width: `${flowerSize * 0.25}px`,
                height: `${flowerSize * 0.25}px`
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

            {/* Sparkles for fully bloomed flowers */}
            {flowerSize >= flower.size * 0.9 && (
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

        {/* Leaves along the stem */}
        {stemHeight > 15 && Array.from({ length: Math.min(2, Math.floor(stemHeight / 20)) }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-80 shadow-sm"
            style={{
              width: '8px',
              height: '4px',
              left: i % 2 === 0 ? '-10px' : '10px',
              bottom: `${15 + i * 12}px`,
              transform: `rotate(${i % 2 === 0 ? -30 : 30}deg)`
            }}
            initial={{ scale: 0, x: 0 }}
            animate={{ 
              scale: 1, 
              x: 0
            }}
            transition={{
              delay: 0.4 + i * 0.1,
              type: "spring"
            }}
          />
        ))}
        
        {/* Stem */}
        <motion.div 
          className="bg-gradient-to-t from-green-600 to-green-500 rounded-lg relative shadow-sm"
          style={{
            width: '4px',
            height: `${stemHeight}px`
          }}
          initial={{ height: 0 }}
          animate={{ 
            height: stemHeight
          }}
          transition={{
            type: "spring", 
            stiffness: 80, 
            damping: 15
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-80 overflow-hidden">
      {/* Clean garden ground */}
      <motion.div 
        className="absolute bottom-0 w-full h-12 bg-gradient-to-r from-emerald-100/70 via-green-200/70 to-emerald-100/70 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Garden bed texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50/40 to-yellow-50/40 rounded-lg" />
        
        {/* Subtle grass elements */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 h-2 bg-green-400/60 rounded-t-full"
            style={{
              left: `${20 + i * 12}%`,
            }}
            animate={{
              scaleY: [1, 1.05, 1],
              opacity: [0.6, 0.8, 0.6]
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
      <div className="absolute top-4 left-4 bg-white/80 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm shadow-sm">
        {safeProgress}%
      </div>

      {/* Render all flowers */}
      {flowerTypes.map(renderFlower)}

      {/* Floating elements for completed garden */}
      {safeProgress > 80 && (
        <>
          {/* Butterfly */}
          <motion.div
            className="absolute text-sm z-30 opacity-70"
            style={{
              left: '40%',
              top: '30%'
            }}
            animate={{
              x: [0, 12, -6, 0],
              y: [0, -6, 2, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🦋
          </motion.div>

          {/* Gentle pollen particles */}
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={`pollen-${i}`}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-50"
              style={{
                left: `${30 + i * 20}%`,
                top: `${50 + i * 8}%`
              }}
              animate={{
                y: [0, -8, 0],
                x: [0, 2, -2, 0],
                opacity: [0.5, 0.8, 0.5]
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
