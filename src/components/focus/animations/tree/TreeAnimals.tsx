
import React from 'react';
import { motion } from 'framer-motion';

interface TreeAnimalsProps {
  progress: number;
}

const TreeAnimals: React.FC<TreeAnimalsProps> = ({ progress }) => {
  return (
    <>
      {/* Rabbit */}
      {progress >= 50 && (
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

      {/* Butterfly and Bird */}
      {progress >= 70 && (
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
    </>
  );
};

export default TreeAnimals;
