
import React from 'react';
import { motion } from 'framer-motion';

interface TreeSkyBackgroundProps {
  progress: number;
  isActive: boolean;
}

const TreeSkyBackground: React.FC<TreeSkyBackgroundProps> = ({ progress, isActive }) => {
  return (
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
      {progress >= 10 && (
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
  );
};

export default TreeSkyBackground;
