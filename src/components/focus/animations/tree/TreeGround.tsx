
import React from 'react';
import { motion } from 'framer-motion';

interface TreeGroundProps {
  progress: number;
}

const TreeGround: React.FC<TreeGroundProps> = ({ progress }) => {
  return (
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
      {progress >= 30 && Array.from({ length: 6 }, (_, i) => (
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
  );
};

export default TreeGround;
