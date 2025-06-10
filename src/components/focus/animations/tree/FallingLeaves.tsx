
import React from 'react';
import { motion } from 'framer-motion';

interface FallingLeavesProps {
  isActive: boolean;
  progress: number;
}

const FallingLeaves: React.FC<FallingLeavesProps> = ({ isActive, progress }) => {
  if (!isActive || progress < 40) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-xs opacity-70"
          style={{
            left: `${15 + (i * 10)}%`,
            top: `${5 + (i % 3) * 10}%`,
            color: ['#f59e0b', '#ef4444', '#eab308', '#f97316'][i % 4]
          }}
          animate={{
            y: [0, 200],
            x: [0, (i % 2 === 0 ? 20 : -20)],
            rotate: [0, 360],
            opacity: [0.7, 0]
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.8
          }}
        >
          🍃
        </motion.div>
      ))}
    </div>
  );
};

export default FallingLeaves;
