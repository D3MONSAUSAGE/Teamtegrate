
import React from 'react';
import { cn } from '@/lib/utils';

interface OceanThemeProps {
  progress: number;
  stage: string;
  isActive: boolean;
  timeOfDay: string;
}

const OceanTheme: React.FC<OceanThemeProps> = ({ progress, stage, isActive, timeOfDay }) => {
  const getWaterGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-orange-200 via-blue-300 to-blue-600';
      case 'evening':
        return 'from-purple-300 via-blue-400 to-blue-700';
      case 'night':
        return 'from-indigo-900 via-blue-900 to-blue-950';
      default:
        return 'from-cyan-200 via-blue-400 to-blue-700';
    }
  };

  const getCoralHeight = () => Math.max(16, 16 + (progress / 100) * 60);
  const getCoralWidth = () => Math.max(12, 12 + (progress / 100) * 32);

  return (
    <div className="absolute inset-0">
      {/* Water Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b transition-all duration-1000", getWaterGradient())} />
      
      {/* Water Surface Effect */}
      <div className="absolute top-0 w-full h-8">
        <div className="relative h-full overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" 
               style={{ animationDuration: '3s' }} />
          <div className="absolute top-1 w-full h-1 bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent animate-pulse" 
               style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
      </div>

      {/* Sunlight Rays */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-full opacity-30">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-yellow-200 to-transparent" />
        <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-yellow-200 to-transparent" />
        <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-yellow-200 to-transparent" />
      </div>

      {/* Ocean Floor */}
      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-yellow-600 to-yellow-500">
        {/* Sand texture */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-700 rounded-full opacity-50"
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 80 + 10}%`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Coral */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 transition-all duration-1000">
        {stage !== 'seed' && (
          <div className="relative">
            {/* Central Coral */}
            <div 
              className={cn(
                "bg-gradient-to-t from-pink-500 to-pink-300 rounded-t-full transition-all duration-700",
                isActive && "animate-pulse"
              )}
              style={{
                width: `${getCoralWidth()}px`,
                height: `${getCoralHeight()}px`,
                animationDuration: '2s'
              }}
            />
            
            {/* Coral branches */}
            {progress >= 30 && (
              <>
                <div 
                  className="absolute bottom-0 -left-2 bg-gradient-to-t from-coral-500 to-coral-300 rounded-t-full transition-all duration-700"
                  style={{
                    width: `${getCoralWidth() * 0.6}px`,
                    height: `${getCoralHeight() * 0.8}px`,
                    backgroundColor: '#ff6b6b'
                  }}
                />
                <div 
                  className="absolute bottom-0 -right-2 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-full transition-all duration-700"
                  style={{
                    width: `${getCoralWidth() * 0.7}px`,
                    height: `${getCoralHeight() * 0.7}px`
                  }}
                />
              </>
            )}

            {/* Sea anemone */}
            {progress >= 50 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="relative w-6 h-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-4 bg-gradient-to-t from-green-500 to-green-300 rounded-full animate-pulse"
                      style={{
                        transform: `rotate(${i * 45}deg) translateY(-50%)`,
                        transformOrigin: 'center bottom',
                        top: '50%',
                        left: '50%',
                        marginLeft: '-2px',
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '3s'
                      }}
                    />
                  ))}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-400 rounded-full" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Seed state */}
        {stage === 'seed' && (
          <div className="w-2 h-2 bg-pink-600 rounded-full transition-all duration-700" />
        )}
      </div>

      {/* Additional Sea Life */}
      {progress >= 25 && (
        <div className="absolute bottom-16 left-1/4">
          <div className="w-3 h-6 bg-gradient-to-t from-green-600 to-green-400 rounded-t-full animate-pulse" 
               style={{ animationDuration: '2s' }} />
        </div>
      )}

      {progress >= 40 && (
        <div className="absolute bottom-14 right-1/4">
          <div className="w-4 h-8 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-full animate-pulse" 
               style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </div>
      )}

      {/* Fish */}
      {progress >= 35 && (
        <div className="absolute top-1/3 left-1/4 animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="text-lg">🐠</div>
        </div>
      )}

      {progress >= 55 && (
        <div className="absolute top-1/2 right-1/3 animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className="text-sm">🐟</div>
        </div>
      )}

      {progress >= 75 && (
        <div className="absolute top-1/4 left-1/2 animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>
          <div className="text-lg">🦈</div>
        </div>
      )}

      {/* Jellyfish */}
      {progress >= 65 && (
        <div className="absolute top-16 right-1/4 animate-bounce" style={{ animationDuration: '6s' }}>
          <div className="text-base">🪼</div>
        </div>
      )}

      {/* Treasure for completion */}
      {stage === 'magnificent' && (
        <div className="absolute bottom-4 right-8 animate-pulse" style={{ animationDuration: '2s' }}>
          <div className="text-lg">💎</div>
        </div>
      )}

      {/* Bubbles */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-bounce opacity-60"
              style={{
                left: `${15 + (i * 10)}%`,
                bottom: `${20 + (i % 4) * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}

      {/* Seaweed swaying */}
      {progress >= 20 && (
        <div className="absolute bottom-12 left-8">
          <div className="w-1 h-16 bg-green-600 rounded-t-full animate-pulse origin-bottom" 
               style={{ animationDuration: '4s', transform: 'rotate(5deg)' }} />
        </div>
      )}

      {progress >= 30 && (
        <div className="absolute bottom-12 right-8">
          <div className="w-1 h-12 bg-green-500 rounded-t-full animate-pulse origin-bottom" 
               style={{ animationDuration: '3s', animationDelay: '1s', transform: 'rotate(-3deg)' }} />
        </div>
      )}
    </div>
  );
};

export default OceanTheme;
