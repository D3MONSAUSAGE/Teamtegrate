
import React, { useMemo } from 'react';
import { ANIMATION_TIMINGS, EASING_CURVES, getRandomFloat, getRandomPosition, shouldReduceMotion } from './AnimationUtils';

interface EnhancedParticleSystemProps {
  isActive: boolean;
  stage: string;
  theme: string;
  progress: number;
  intensity?: 'low' | 'medium' | 'high';
}

const EnhancedParticleSystem: React.FC<EnhancedParticleSystemProps> = ({ 
  isActive, 
  stage, 
  theme, 
  progress,
  intensity = 'medium'
}) => {
  const reducedMotion = shouldReduceMotion();
  
  if (!isActive || stage === 'seed' || reducedMotion) return null;

  const getParticleConfig = () => {
    const baseCount = intensity === 'low' ? 3 : intensity === 'medium' ? 6 : 10;
    const count = Math.min(baseCount + Math.floor(progress / 20), 15);
    
    switch (theme) {
      case 'forest':
        return {
          count,
          particles: ['🍃', '✨', '🌟', '💫'],
          colors: ['#22c55e', '#16a34a', '#15803d', '#facc15'],
          effects: ['ember', 'leaf-drift', 'sparkle']
        };
      case 'garden':
        return {
          count,
          particles: ['🌸', '✨', '🦋', '💐', '🌺'],
          colors: ['#ec4899', '#f472b6', '#fbbf24', '#10b981'],
          effects: ['pollen', 'butterfly-dance', 'flower-bloom']
        };
      case 'city':
        return {
          count,
          particles: ['⚡', '✨', '💎', '🌟'],
          colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b'],
          effects: ['electric', 'neon-glow', 'tech-pulse']
        };
      case 'ocean':
        return {
          count,
          particles: ['💧', '🫧', '✨', '🌊'],
          colors: ['#06b6d4', '#0891b2', '#0e7490', '#22d3ee'],
          effects: ['bubble-float', 'wave-motion', 'light-ray']
        };
      case 'space':
        return {
          count,
          particles: ['⭐', '✨', '💫', '🌟'],
          colors: ['#a855f7', '#8b5cf6', '#6366f1', '#ffffff'],
          effects: ['cosmic-dust', 'energy-wave', 'star-twinkle']
        };
      default:
        return {
          count,
          particles: ['✨', '🌟', '💫', '⭐'],
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
          effects: ['general-sparkle']
        };
    }
  };

  const config = getParticleConfig();
  
  const particles = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => {
      const isEmoji = Math.random() > 0.6;
      const particle = config.particles[i % config.particles.length];
      const color = config.colors[i % config.colors.length];
      const position = getRandomPosition();
      const size = getRandomFloat(0.5, 2);
      const duration = getRandomFloat(2, 5);
      const delay = getRandomFloat(0, 2);
      
      return {
        id: i,
        isEmoji,
        particle,
        color,
        position,
        size,
        duration,
        delay
      };
    });
  }, [config.count, theme, progress]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Enhanced Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute opacity-70 animate-bounce"
          style={{
            left: `${p.position.x}%`,
            top: `${p.position.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationTimingFunction: EASING_CURVES.natural,
            transform: `scale(${p.size})`
          }}
        >
          {p.isEmoji ? (
            <div 
              className="text-sm transition-all duration-300"
              style={{
                filter: `brightness(${1 + (progress / 100) * 0.5})`,
                textShadow: `0 0 ${10 * p.size}px ${p.color}`
              }}
            >
              {p.particle}
            </div>
          ) : (
            <div 
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: p.color,
                boxShadow: `0 0 ${15 * p.size}px ${p.color}`,
                opacity: 0.7 + (progress / 100) * 0.3
              }}
            />
          )}
        </div>
      ))}

      {/* Theme-specific Effects */}
      {theme === 'forest' && progress >= 30 && (
        <div className="absolute inset-0">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={`ember-${i}`}
              className="absolute w-1 h-3 bg-orange-400 rounded-full opacity-60"
              style={{
                left: `${20 + (i * 20)}%`,
                top: `${30 + (i * 10)}%`,
                animation: `float ${3 + i}s ${EASING_CURVES.natural} infinite alternate`,
                animationDelay: `${i * 0.5}s`,
                filter: 'blur(0.5px)',
                boxShadow: '0 0 10px #fb923c'
              }}
            />
          ))}
        </div>
      )}

      {theme === 'garden' && progress >= 40 && (
        <div className="absolute inset-0">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`pollen-${i}`}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-50"
              style={{
                left: `${30 + (i * 15)}%`,
                top: `${20 + (i * 20)}%`,
                animation: `drift ${4 + i}s ${EASING_CURVES.natural} infinite`,
                animationDelay: `${i * 0.8}s`,
                boxShadow: '0 0 8px #fcd34d'
              }}
            />
          ))}
        </div>
      )}

      {theme === 'city' && progress >= 50 && (
        <div className="absolute inset-0">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={`electric-${i}`}
              className="absolute w-8 h-0.5 bg-blue-400 opacity-70"
              style={{
                left: `${25 + (i * 30)}%`,
                top: `${40 + (i * 10)}%`,
                animation: `pulse ${0.5 + i * 0.2}s ${EASING_CURVES.elastic} infinite`,
                animationDelay: `${i * 0.3}s`,
                boxShadow: '0 0 15px #60a5fa',
                transform: `rotate(${45 + i * 90}deg)`
              }}
            />
          ))}
        </div>
      )}

      {theme === 'ocean' && progress >= 35 && (
        <div className="absolute inset-0">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={`bubble-${i}`}
              className="absolute bg-cyan-200 rounded-full opacity-40"
              style={{
                width: `${4 + Math.sin(i) * 2}px`,
                height: `${4 + Math.sin(i) * 2}px`,
                left: `${15 + (i * 12)}%`,
                bottom: `${10 + (i % 3) * 20}%`,
                animation: `float ${2 + i * 0.3}s ${EASING_CURVES.smooth} infinite`,
                animationDelay: `${i * 0.4}s`,
                boxShadow: '0 0 10px #67e8f9'
              }}
            />
          ))}
        </div>
      )}

      {theme === 'space' && progress >= 60 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-32 h-32 border border-purple-400/20 rounded-full opacity-30"
            style={{
              animation: `pulse ${4}s ${EASING_CURVES.smooth} infinite`,
              boxShadow: '0 0 50px #a855f7'
            }}
          />
          <div 
            className="absolute w-24 h-24 border border-blue-400/20 rounded-full opacity-20"
            style={{
              animation: `pulse ${3}s ${EASING_CURVES.smooth} infinite`,
              animationDelay: '1s',
              boxShadow: '0 0 40px #3b82f6'
            }}
          />
        </div>
      )}

      {/* Milestone Celebration Effects */}
      {(progress === 25 || progress === 50 || progress === 75 || progress === 100) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`celebration-${i}`}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-60px)`,
                animation: `ping 1s ${EASING_CURVES.bounce} infinite`,
                animationDelay: `${i * 0.1}s`,
                boxShadow: '0 0 20px #facc15'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedParticleSystem;
