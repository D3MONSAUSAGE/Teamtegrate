
import React from 'react';
import { cn } from '@/lib/utils';

interface SpaceThemeProps {
  progress: number;
  stage: string;
  isActive: boolean;
  timeOfDay: string;
}

const SpaceTheme: React.FC<SpaceThemeProps> = ({ progress, stage, isActive }) => {
  const getPlanetSize = () => Math.max(24, 24 + (progress / 100) * 80);
  const getRingSize = () => Math.max(32, 32 + (progress / 100) * 100);

  return (
    <div className="absolute inset-0">
      {/* Space Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-indigo-900 to-black" />
      
      {/* Stars */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 95}%`,
              top: `${Math.random() * 95}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Nebula Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" 
             style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse" 
             style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-pink-500/20 rounded-full blur-xl animate-pulse" 
             style={{ animationDuration: '7s', animationDelay: '4s' }} />
      </div>

      {/* Main Planet */}
      <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 transition-all duration-1000">
        {stage !== 'seed' && (
          <div className="relative">
            {/* Planet Core */}
            <div 
              className={cn(
                "rounded-full bg-gradient-to-br transition-all duration-700",
                stage === 'sprout' && "from-red-400 to-red-600",
                stage === 'small' && "from-orange-400 to-red-500",
                stage === 'growing' && "from-yellow-400 to-orange-500",
                stage === 'developing' && "from-green-400 to-blue-500",
                stage === 'maturing' && "from-blue-400 to-purple-500",
                stage === 'flourishing' && "from-purple-400 to-pink-500",
                stage === 'magnificent' && "from-pink-400 to-purple-600",
                isActive && "animate-pulse"
              )}
              style={{
                width: `${getPlanetSize()}px`,
                height: `${getPlanetSize()}px`,
                animationDuration: '3s'
              }}
            />

            {/* Planet Surface Details */}
            {progress >= 25 && (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black/30 rounded-full" />
                <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-black/20 rounded-full" />
                <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full" />
              </div>
            )}

            {/* Planet Rings */}
            {progress >= 40 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div 
                  className="border-2 border-gray-400/40 rounded-full transition-all duration-700"
                  style={{
                    width: `${getRingSize()}px`,
                    height: `${getRingSize() * 0.3}px`,
                    borderWidth: '1px'
                  }}
                />
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-gray-300/30 rounded-full transition-all duration-700"
                  style={{
                    width: `${getRingSize() * 1.2}px`,
                    height: `${getRingSize() * 0.36}px`,
                    borderWidth: '1px'
                  }}
                />
              </div>
            )}

            {/* Atmospheric Glow */}
            {progress >= 60 && (
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/20 blur-sm animate-pulse"
                style={{
                  width: `${getPlanetSize() * 1.3}px`,
                  height: `${getPlanetSize() * 1.3}px`,
                  animationDuration: '4s'
                }}
              />
            )}
          </div>
        )}
        
        {/* Seed state - asteroid */}
        {stage === 'seed' && (
          <div className="w-3 h-3 bg-gray-600 rounded-full transition-all duration-700" />
        )}
      </div>

      {/* Moons */}
      {progress >= 30 && (
        <div className="absolute top-1/3 left-1/4 transition-all duration-700">
          <div className="w-4 h-4 bg-gray-300 rounded-full shadow-lg animate-pulse" 
               style={{ animationDuration: '5s' }} />
        </div>
      )}

      {progress >= 50 && (
        <div className="absolute top-1/2 right-1/4 transition-all duration-700">
          <div className="w-3 h-3 bg-yellow-200 rounded-full shadow-lg animate-pulse" 
               style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
      )}

      {progress >= 70 && (
        <div className="absolute bottom-1/3 right-1/3 transition-all duration-700">
          <div className="w-2 h-2 bg-red-300 rounded-full shadow-lg animate-pulse" 
               style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
      )}

      {/* Space Stations */}
      {progress >= 80 && (
        <div className="absolute top-1/4 right-1/3">
          <div className="w-2 h-4 bg-gray-400 rounded-sm" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-gray-500 rounded-full" />
        </div>
      )}

      {/* Spacecraft */}
      {progress >= 90 && (
        <div className="absolute top-16 left-1/3 animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="text-sm">🚀</div>
        </div>
      )}

      {/* Distant Galaxy */}
      {progress >= 35 && (
        <div className="absolute top-8 right-8 opacity-60">
          <div className="w-8 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full blur-sm animate-pulse" 
               style={{ animationDuration: '8s' }} />
        </div>
      )}

      {/* Shooting Stars */}
      {isActive && progress >= 25 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-8 h-0.5 bg-gradient-to-r from-white to-transparent opacity-70 animate-ping"
              style={{
                left: `${20 + (i * 25)}%`,
                top: `${15 + (i * 20)}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: '3s',
                transform: 'rotate(-45deg)'
              }}
            />
          ))}
        </div>
      )}

      {/* Comet for magnificent stage */}
      {stage === 'magnificent' && (
        <div className="absolute top-12 left-12 animate-pulse" style={{ animationDuration: '2s' }}>
          <div className="relative">
            <div className="w-3 h-3 bg-blue-200 rounded-full" />
            <div className="absolute top-1 left-3 w-8 h-1 bg-gradient-to-r from-blue-200 to-transparent rounded-full opacity-70" />
          </div>
        </div>
      )}

      {/* Black Hole Effect for maximum progress */}
      {progress === 100 && (
        <div className="absolute top-8 left-8">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-black rounded-full" />
            <div className="absolute inset-1 border border-purple-400 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-2 border border-blue-400 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceTheme;
