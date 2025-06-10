
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
    return Math.max(60, 60 + (progress / 100) * 40 * multiplier);
  };

  if (stage === 'seed') return null;

  return (
    <motion.div 
      className="relative mb-1"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Main crown with organic shape */}
      <motion.div 
        className="relative"
        style={{
          width: `${getCrownSize(progress)}px`,
          height: `${getCrownSize(progress) * 0.9}px`,
        }}
        animate={isActive ? {
          scale: [1, 1.02, 1],
          rotate: [-0.5, 0.5, -0.5]
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Organic crown shape with multiple layers */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-green-400 via-green-500 to-green-600 shadow-lg"
          style={{
            borderRadius: '60% 40% 50% 70% / 50% 60% 40% 50%',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
          }}
        />
        
        {/* Additional organic layers for depth */}
        <div 
          className="absolute top-1 left-1 right-2 bottom-2 bg-gradient-to-b from-green-300/60 to-transparent"
          style={{
            borderRadius: '50% 60% 40% 70% / 60% 50% 60% 40%'
          }}
        />
        
        {/* Natural texture spots */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-green-300 rounded-full opacity-40"
            style={{
              top: `${25 + (i % 2) * 30}%`,
              left: `${20 + (i % 3) * 25}%`,
            }}
          />
        ))}
      </motion.div>
      
      {/* Side branches with organic shapes */}
      {progress >= 25 && (
        <>
          <motion.div 
            className="absolute top-2 bg-gradient-to-b from-green-400 to-green-600 shadow-md"
            style={{
              left: `-${getCrownSize(progress) * 0.12}px`,
              width: `${getCrownSize(progress) * 0.5}px`,
              height: `${getCrownSize(progress) * 0.6}px`,
              borderRadius: '70% 30% 60% 40% / 40% 70% 30% 60%'
            }}
            initial={{ scale: 0, x: -15 }}
            animate={{ 
              scale: 1, 
              x: 0,
              rotate: isActive ? [-2, 2, -2] : 0
            }}
            transition={{
              scale: { type: "spring", delay: 0.3 },
              rotate: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
          <motion.div 
            className="absolute top-2 bg-gradient-to-b from-green-400 to-green-600 shadow-md"
            style={{
              right: `-${getCrownSize(progress) * 0.12}px`,
              width: `${getCrownSize(progress) * 0.5}px`,
              height: `${getCrownSize(progress) * 0.6}px`,
              borderRadius: '30% 70% 40% 60% / 70% 40% 60% 30%'
            }}
            initial={{ scale: 0, x: 15 }}
            animate={{ 
              scale: 1, 
              x: 0,
              rotate: isActive ? [2, -2, 2] : 0
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
      
      {/* Flowers for complete stage */}
      {stage === 'complete' && (
        <motion.div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ top: `-${getCrownSize(progress) * 0.15}px` }}
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.8 }}
        >
          <div className="flex gap-1">
            {['#f472b6', '#a78bfa', '#fbbf24'].map((color, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full shadow-sm"
                style={{ backgroundColor: color }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
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
