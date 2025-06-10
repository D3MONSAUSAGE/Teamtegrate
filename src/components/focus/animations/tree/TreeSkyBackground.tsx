
import React from 'react';
import { motion } from 'framer-motion';

interface TreeSkyBackgroundProps {
  progress: number;
  isActive: boolean;
}

const TreeSkyBackground: React.FC<TreeSkyBackgroundProps> = ({ progress, isActive }) => {
  return (
    <motion.div 
      className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-200"
      animate={{
        background: isActive 
          ? [
              'linear-gradient(to bottom, #7dd3fc, #bae6fd, #bbf7d0)',
              'linear-gradient(to bottom, #93c5fd, #dbeafe, #dcfce7)',
              'linear-gradient(to bottom, #7dd3fc, #bae6fd, #bbf7d0)'
            ]
          : 'linear-gradient(to bottom, #7dd3fc, #bae6fd, #bbf7d0)'
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Soft, fluffy clouds */}
      {progress >= 10 && (
        <>
          <motion.div
            className="absolute top-6 bg-white/50 rounded-full"
            style={{ 
              left: '20%',
              width: '60px',
              height: '24px',
              borderRadius: '50px 30px 40px 60px'
            }}
            animate={{
              x: [0, 25, 0],
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-10 bg-white/40 rounded-full"
            style={{ 
              right: '25%',
              width: '45px',
              height: '20px',
              borderRadius: '40px 60px 30px 50px'
            }}
            animate={{
              x: [0, -18, 0],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
        </>
      )}

      {/* Warm, gentle sun */}
      <motion.div 
        className="absolute top-8 right-10 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))'
        }}
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
          filter: isActive 
            ? [
                'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
                'drop-shadow(0 0 16px rgba(251, 191, 36, 0.6))',
                'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))'
              ]
            : 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))'
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default TreeSkyBackground;
