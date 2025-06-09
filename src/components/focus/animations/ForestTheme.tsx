
import React from 'react';
import { cn } from '@/lib/utils';

interface ForestThemeProps {
  progress: number;
  stage: string;
  isActive: boolean;
  timeOfDay: string;
}

const ForestTheme: React.FC<ForestThemeProps> = ({ progress, stage, isActive, timeOfDay }) => {
  const getTimeGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-orange-200 via-yellow-100 to-blue-200';
      case 'evening':
        return 'from-orange-300 via-pink-200 to-purple-300';
      case 'night':
        return 'from-indigo-900 via-purple-800 to-blue-900';
      default:
        return 'from-blue-300 via-sky-200 to-cyan-100';
    }
  };

  const getTreeHeight = () => Math.max(24, 24 + (progress / 100) * 120);
  const getTreeWidth = () => Math.max(32, 32 + (progress / 100) * 80);
  const getTrunkHeight = () => Math.max(16, 16 + (progress / 100) * 40);

  return (
    <div className="absolute inset-0">
      {/* Animated Sky Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b transition-all duration-1000", getTimeGradient())} />
      
      {/* Animated Clouds */}
      <div className="absolute top-4 w-full">
        <div className="relative">
          <div className="absolute top-0 left-1/4 w-16 h-8 bg-white/60 rounded-full animate-pulse" 
               style={{ animationDuration: '4s' }} />
          <div className="absolute top-2 left-1/3 w-12 h-6 bg-white/40 rounded-full animate-pulse" 
               style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-1 right-1/4 w-20 h-10 bg-white/50 rounded-full animate-pulse" 
               style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>
      </div>

      {/* Sun/Moon */}
      <div className="absolute top-6 right-8">
        {timeOfDay === 'night' ? (
          <div className="w-8 h-8 bg-yellow-100 rounded-full shadow-lg shadow-yellow-200/50" />
        ) : (
          <div className="w-10 h-10 bg-yellow-400 rounded-full shadow-lg shadow-yellow-300/50 animate-pulse" 
               style={{ animationDuration: '3s' }} />
        )}
      </div>

      {/* Ground with grass texture */}
      <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-green-400 to-green-300 rounded-t-lg">
        {/* Grass blades */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-1 bg-green-500 rounded-t-full animate-pulse"
            style={{
              left: `${10 + i * 7}%`,
              height: `${8 + Math.sin(i) * 4}px`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '2s'
            }}
          />
        ))}
      </div>

      {/* Main Tree */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-1000">
        {/* Tree Crown */}
        {stage !== 'seed' && (
          <div className="relative mb-2 flex justify-center">
            <div 
              className={cn(
                "bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-700",
                isActive && "animate-pulse"
              )}
              style={{
                width: `${getTreeWidth()}px`,
                height: `${getTreeHeight()}px`,
                animationDuration: '3s'
              }}
            />
            
            {/* Side branches for developed stages */}
            {progress >= 30 && (
              <>
                <div 
                  className="absolute top-3 -left-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-700"
                  style={{
                    width: `${getTreeWidth() * 0.6}px`,
                    height: `${getTreeHeight() * 0.7}px`
                  }}
                />
                <div 
                  className="absolute top-3 -right-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-700"
                  style={{
                    width: `${getTreeWidth() * 0.6}px`,
                    height: `${getTreeHeight() * 0.7}px`
                  }}
                />
              </>
            )}

            {/* Flowers for magnificent stage */}
            {stage === 'magnificent' && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-2 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="w-3 h-3 bg-pink-400 rounded-full" />
                  <div className="w-3 h-3 bg-purple-400 rounded-full" style={{ animationDelay: '0.3s' }} />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" style={{ animationDelay: '0.6s' }} />
                  <div className="w-3 h-3 bg-red-400 rounded-full" style={{ animationDelay: '0.9s' }} />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Tree Trunk */}
        <div 
          className={cn(
            "w-4 bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg mx-auto transition-all duration-700",
            stage === 'seed' && "w-2 bg-amber-800"
          )}
          style={{
            height: `${getTrunkHeight()}px`,
            minHeight: stage === 'seed' ? '8px' : '16px'
          }}
        />
      </div>

      {/* Background Trees */}
      {progress >= 20 && (
        <>
          <div className="absolute bottom-16 left-1/4 transform -translate-x-1/2 opacity-60">
            <div className="w-6 h-16 bg-gradient-to-b from-green-500 to-green-700 rounded-full mb-1" />
            <div className="w-2 h-8 bg-amber-700 rounded-b-lg mx-auto" />
          </div>
          <div className="absolute bottom-16 right-1/4 transform translate-x-1/2 opacity-50">
            <div className="w-8 h-20 bg-gradient-to-b from-green-500 to-green-700 rounded-full mb-1" />
            <div className="w-2 h-10 bg-amber-700 rounded-b-lg mx-auto" />
          </div>
        </>
      )}

      {/* Forest Animals */}
      {progress >= 50 && (
        <div className="absolute bottom-20 right-16 animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="text-sm">🐰</div>
        </div>
      )}

      {progress >= 70 && (
        <div className="absolute bottom-32 left-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <div className="text-sm">🦋</div>
        </div>
      )}

      {/* Falling Leaves Animation */}
      {isActive && progress >= 40 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xs opacity-70 animate-bounce"
              style={{
                left: `${20 + (i * 12)}%`,
                top: `${10 + (i % 3) * 15}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: '4s',
                color: ['#f59e0b', '#ef4444', '#eab308', '#f97316'][i % 4]
              }}
            >
              🍃
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForestTheme;
