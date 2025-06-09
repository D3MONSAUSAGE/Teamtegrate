
import React from 'react';

interface ParticleSystemProps {
  isActive: boolean;
  stage: string;
  theme: string;
  progress: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ isActive, stage, theme, progress }) => {
  if (!isActive || stage === 'seed') return null;

  const getParticleCount = () => {
    if (progress < 25) return 3;
    if (progress < 50) return 5;
    if (progress < 75) return 7;
    return 10;
  };

  const getParticleColor = () => {
    switch (theme) {
      case 'forest':
        return ['#22c55e', '#16a34a', '#15803d', '#facc15'];
      case 'garden':
        return ['#ec4899', '#f472b6', '#fbbf24', '#10b981'];
      case 'city':
        return ['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b'];
      case 'ocean':
        return ['#06b6d4', '#0891b2', '#0e7490', '#22d3ee'];
      case 'space':
        return ['#a855f7', '#8b5cf6', '#6366f1', '#ffffff'];
      default:
        return ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
    }
  };

  const getParticleEmoji = () => {
    switch (theme) {
      case 'forest':
        return ['✨', '🍃', '🌟', '💫'];
      case 'garden':
        return ['🌸', '✨', '🦋', '💐'];
      case 'city':
        return ['⚡', '✨', '💎', '🌟'];
      case 'ocean':
        return ['💧', '🫧', '✨', '🌊'];
      case 'space':
        return ['⭐', '✨', '💫', '🌟'];
      default:
        return ['✨', '🌟', '💫', '⭐'];
    }
  };

  const colors = getParticleColor();
  const emojis = getParticleEmoji();
  const particleCount = getParticleCount();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating Particles */}
      {[...Array(particleCount)].map((_, i) => {
        const isEmoji = Math.random() > 0.7;
        const color = colors[i % colors.length];
        const emoji = emojis[i % emojis.length];
        
        return (
          <div
            key={i}
            className="absolute animate-bounce opacity-70"
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${20 + (i % 4) * 15}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + (i % 3)}s`
            }}
          >
            {isEmoji ? (
              <div className="text-sm">{emoji}</div>
            ) : (
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
        );
      })}

      {/* Growth Sparkles */}
      {progress >= 50 && (
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-yellow-400 animate-ping opacity-60"
              style={{
                left: `${25 + (i * 12)}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.6}s`,
                animationDuration: '2s',
                fontSize: '8px'
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Milestone Burst */}
      {(progress === 25 || progress === 50 || progress === 75 || progress === 100) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(8)].map((_, i) => (
            <div
              key={`burst-${i}`}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-40px)`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}

      {/* Weather Effects */}
      {theme === 'forest' && Math.random() > 0.7 && (
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={`rain-${i}`}
              className="absolute w-0.5 h-4 bg-blue-300 opacity-50 animate-bounce"
              style={{
                left: `${20 + (i * 20)}%`,
                top: `${10 + (i * 10)}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      )}

      {/* Energy Waves for Space Theme */}
      {theme === 'space' && progress >= 60 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border border-purple-400/30 rounded-full animate-ping" 
               style={{ animationDuration: '4s' }} />
          <div className="absolute w-24 h-24 border border-blue-400/30 rounded-full animate-ping" 
               style={{ animationDuration: '3s', animationDelay: '1s' }} />
        </div>
      )}
    </div>
  );
};

export default ParticleSystem;
