
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FramerParticleSystemProps {
  isActive: boolean;
  stage: string;
  theme: string;
  progress: number;
  intensity?: 'low' | 'medium' | 'high';
}

const FramerParticleSystem: React.FC<FramerParticleSystemProps> = ({ 
  isActive, 
  stage, 
  theme, 
  progress,
  intensity = 'medium'
}) => {
  if (!isActive || stage === 'seed') return null;

  const particleConfig = useMemo(() => {
    const baseCount = intensity === 'low' ? 4 : intensity === 'medium' ? 8 : 12;
    const count = Math.min(baseCount + Math.floor(progress / 15), 20);
    
    switch (theme) {
      case 'forest':
        return {
          count,
          particles: ['🍃', '✨', '🌟', '💫'],
          colors: ['#22c55e', '#16a34a', '#15803d', '#facc15']
        };
      case 'garden':
        return {
          count,
          particles: ['🌸', '✨', '🦋', '💐', '🌺'],
          colors: ['#ec4899', '#f472b6', '#fbbf24', '#10b981']
        };
      case 'city':
        return {
          count,
          particles: ['⚡', '✨', '💎', '🌟'],
          colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b']
        };
      default:
        return {
          count,
          particles: ['✨', '🌟', '💫', '⭐'],
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
        };
    }
  }, [theme, progress, intensity]);

  const floatingVariants = useMemo(() => ({
    animate: {
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }), []);

  const magneticVariants = useMemo(() => ({
    animate: (custom: number) => ({
      x: [0, Math.sin(custom) * 30, 0],
      y: [0, Math.cos(custom) * 20, 0],
      transition: {
        duration: 3 + custom * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: custom * 0.2
      }
    })
  }), []);

  const particleData = useMemo(() => 
    Array.from({ length: particleConfig.count }, (_, i) => ({
      id: i,
      isEmoji: Math.random() > 0.5,
      particle: particleConfig.particles[i % particleConfig.particles.length],
      color: particleConfig.colors[i % particleConfig.colors.length],
      size: 0.8 + Math.random() * 1.2,
      left: 10 + (i * 8) % 80,
      top: 15 + (i % 4) * 20
    })), [particleConfig]
  );

  const isCelebrationMilestone = progress === 25 || progress === 50 || progress === 75 || progress === 100;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {/* Enhanced Floating Particles */}
        {particleData.map((data) => (
          <motion.div
            key={data.id}
            className="absolute"
            style={{
              left: `${data.left}%`,
              top: `${data.top}%`
            }}
            variants={data.id % 2 === 0 ? floatingVariants : magneticVariants}
            custom={data.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, data.size, data.size, 0],
              ...floatingVariants.animate
            }}
            transition={{
              opacity: {
                duration: 8,
                repeat: Infinity,
                delay: data.id * 0.3
              },
              scale: {
                duration: 8,
                repeat: Infinity,
                delay: data.id * 0.3
              }
            }}
          >
            {data.isEmoji ? (
              <motion.div 
                className="text-sm"
                animate={{
                  filter: [
                    'brightness(1)',
                    'brightness(1.3)',
                    'brightness(1)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {data.particle}
              </motion.div>
            ) : (
              <motion.div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: data.color }}
                animate={{
                  boxShadow: [
                    `0 0 0px ${data.color}`,
                    `0 0 20px ${data.color}`,
                    `0 0 0px ${data.color}`
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
        ))}

        {/* Milestone Celebration Burst */}
        {isCelebrationMilestone && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <motion.div
                key={`celebration-${i}`}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos(i * 22.5 * Math.PI / 180) * 80,
                  y: Math.sin(i * 22.5 * Math.PI / 180) * 80
                }}
                transition={{
                  duration: 2,
                  ease: "easeOut",
                  delay: i * 0.05
                }}
                style={{
                  boxShadow: '0 0 20px #facc15'
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Theme-specific Physics Effects */}
        {theme === 'forest' && progress >= 30 && (
          <div className="absolute inset-0">
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={`wind-${i}`}
                className="absolute text-green-500 opacity-60 text-xs"
                style={{
                  left: `${20 + (i * 25)}%`,
                  top: `${10 + (i * 20)}%`
                }}
                animate={{
                  x: [0, 40, -20, 0],
                  y: [0, -10, 5, 0],
                  rotate: [0, 15, -10, 0]
                }}
                transition={{
                  duration: 6 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.8
                }}
              >
                🍃
              </motion.div>
            ))}
          </div>
        )}

        {theme === 'garden' && progress >= 40 && (
          <div className="absolute inset-0">
            {Array.from({ length: 2 }, (_, i) => (
              <motion.div
                key={`butterfly-${i}`}
                className="absolute text-pink-400 text-sm"
                style={{
                  left: `${30 + (i * 30)}%`,
                  top: `${20 + (i * 25)}%`
                }}
                animate={{
                  x: [0, 30, -15, 20, 0],
                  y: [0, -20, 10, -5, 0],
                  scale: [1, 1.2, 0.9, 1.1, 1]
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 1.2
                }}
              >
                🦋
              </motion.div>
            ))}
          </div>
        )}

        {/* Interactive Magnetic Field Effect */}
        {progress >= 60 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <motion.div
              className="w-40 h-40 border border-primary/10 rounded-full"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute w-28 h-28 border border-primary/15 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.15, 0.4, 0.15]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FramerParticleSystem;
