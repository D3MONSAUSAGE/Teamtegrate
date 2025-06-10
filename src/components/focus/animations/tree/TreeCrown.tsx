
import React from 'react';
import { motion } from 'framer-motion';

interface TreeCrownProps {
  progress: number;
  isActive: boolean;
  stage: 'seed' | 'growing' | 'complete';
}

const TreeCrown: React.FC<TreeCrownProps> = ({ progress, isActive, stage }) => {
  const getCrownSize = (progress: number, multiplier: number = 1) => {
    if (progress === 0) return 0;
    return Math.max(80, 80 + (progress / 100) * 50 * multiplier);
  };

  if (stage === 'seed') return null;

  return (
    <motion.div 
      className="relative mb-2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      {/* Main crown */}
      <motion.div 
        className="relative"
        style={{
          width: `${getCrownSize(progress)}px`,
          height: `${getCrownSize(progress)}px`,
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
            width: `${getCrownSize(progress)}px`,
            height: `${getCrownSize(progress)}px`,
          }}
        />
        
        {/* Main crown with dark colors and white border */}
        <div 
          className="relative bg-gradient-to-b from-green-700 to-green-900 rounded-full border-4 border-white shadow-2xl"
          style={{
            width: `${getCrownSize(progress)}px`,
            height: `${getCrownSize(progress)}px`,
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
      
      {/* Side branches */}
      {progress >= 25 && (
        <>
          <motion.div 
            className="absolute top-1 bg-gradient-to-b from-green-700 to-green-900 rounded-full border-2 border-white shadow-lg"
            style={{
              left: `-${getCrownSize(progress) * 0.15}px`,
              width: `${getCrownSize(progress) * 0.6}px`,
              height: `${getCrownSize(progress) * 0.7}px`,
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
              right: `-${getCrownSize(progress) * 0.15}px`,
              width: `${getCrownSize(progress) * 0.6}px`,
              height: `${getCrownSize(progress) * 0.7}px`,
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
          style={{ top: `-${getCrownSize(progress) * 0.2}px` }}
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
  );
};

export default TreeCrown;
