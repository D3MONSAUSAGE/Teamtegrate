
import React from 'react';
import { motion } from 'framer-motion';

interface TreeGroundProps {
  progress: number;
}

const TreeGround: React.FC<TreeGroundProps> = ({ progress }) => {
  return (
    <motion.div 
      className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-green-700 via-green-600 to-green-500"
      style={{
        borderRadius: '0 0 0 0'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Natural grass blades */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 bg-green-500 opacity-60"
          style={{
            left: `${5 + i * 4.5}%`,
            width: '1px',
            height: `${4 + Math.sin(i * 0.5) * 2}px`,
            borderRadius: '50% 50% 0 0'
          }}
          animate={{
            rotate: [-1.5, 1.5, -1.5],
            scaleY: [1, 1.1, 1]
          }}
          transition={{
            duration: 4 + i * 0.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05
          }}
        />
      ))}

      {/* Small bushes and undergrowth */}
      {progress >= 30 && Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`bush-${i}`}
          className="absolute bottom-1 bg-green-700 opacity-50"
          style={{
            left: `${10 + i * 10}%`,
            width: `${8 + i % 3}px`,
            height: `${6 + i % 2}px`,
            borderRadius: '60% 40% 50% 70% / 50% 60% 40% 50%'
          }}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            y: [0, -0.5, 0]
          }}
          transition={{
            scale: { delay: 0.5 + i * 0.1, type: "spring" },
            y: {
              duration: 5 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      ))}

      {/* Small flowers in the grass */}
      {progress >= 50 && Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={`flower-${i}`}
          className="absolute bottom-2 w-1 h-1 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            backgroundColor: ['#f472b6', '#a78bfa', '#fbbf24', '#fb7185'][i % 4]
          }}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            scale: { delay: 1 + i * 0.2, type: "spring" },
            opacity: {
              duration: 3 + i * 0.5,
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
