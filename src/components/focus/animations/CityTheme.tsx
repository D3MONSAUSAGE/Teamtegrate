
import React from 'react';
import { cn } from '@/lib/utils';

interface CityThemeProps {
  progress: number;
  stage: string;
  isActive: boolean;
  timeOfDay: string;
}

const CityTheme: React.FC<CityThemeProps> = ({ progress, stage, isActive, timeOfDay }) => {
  const getTimeGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-orange-300 via-pink-200 to-blue-300';
      case 'evening':
        return 'from-orange-400 via-red-300 to-purple-400';
      case 'night':
        return 'from-gray-900 via-blue-900 to-purple-900';
      default:
        return 'from-blue-400 via-cyan-300 to-gray-200';
    }
  };

  const getBuildingHeight = (maxHeight: number) => {
    return Math.max(12, (progress / 100) * maxHeight);
  };

  const buildingHeights = [80, 120, 160, 100, 60, 140, 90];

  return (
    <div className="absolute inset-0">
      {/* Sky Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b transition-all duration-1000", getTimeGradient())} />
      
      {/* Sun/Moon */}
      <div className="absolute top-8 right-12">
        {timeOfDay === 'night' ? (
          <div className="w-6 h-6 bg-gray-200 rounded-full shadow-lg shadow-gray-300/50" />
        ) : (
          <div className="w-8 h-8 bg-yellow-400 rounded-full shadow-lg shadow-yellow-300/50" />
        )}
      </div>

      {/* Clouds */}
      <div className="absolute top-6 w-full">
        <div className="relative">
          <div className="absolute top-0 left-1/5 w-12 h-6 bg-white/50 rounded-full animate-pulse" 
               style={{ animationDuration: '4s' }} />
          <div className="absolute top-3 right-1/5 w-16 h-8 bg-white/40 rounded-full animate-pulse" 
               style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>
      </div>

      {/* Ground/Street */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-gray-600 to-gray-500">
        {/* Street lines */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-yellow-300 opacity-60" />
        <div className="w-full h-full flex justify-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-6 h-1 bg-yellow-200 mt-3 mx-2 rounded-full opacity-70" />
          ))}
        </div>
      </div>

      {/* Buildings */}
      <div className="absolute bottom-8 w-full flex justify-center items-end gap-1">
        {buildingHeights.map((maxHeight, i) => {
          const currentHeight = getBuildingHeight(maxHeight);
          const windowRows = Math.floor(currentHeight / 20);
          
          return (
            <div
              key={i}
              className={cn(
                "bg-gradient-to-t rounded-t-sm transition-all duration-700",
                isActive && "animate-pulse",
                timeOfDay === 'night' ? 
                  "from-gray-700 to-gray-600" : 
                  ["from-blue-600 to-blue-500", "from-gray-600 to-gray-500", "from-indigo-600 to-indigo-500"][i % 3]
              )}
              style={{ 
                height: `${currentHeight}px`,
                width: `${12 + (i % 3) * 4}px`,
                minHeight: progress > 0 ? '12px' : '0px',
                animationDuration: '3s',
                animationDelay: `${i * 0.2}s`
              }}
            >
              {/* Windows */}
              {currentHeight > 20 && (
                <div className="flex flex-col gap-1 p-1 pt-2">
                  {[...Array(windowRows)].map((_, windowRow) => (
                    <div key={windowRow} className="flex gap-1 justify-center">
                      {[...Array(Math.min(2, Math.floor((12 + (i % 3) * 4) / 6)))].map((_, windowCol) => (
                        <div 
                          key={windowCol}
                          className={cn(
                            "w-1 h-1 rounded-sm transition-all duration-500",
                            timeOfDay === 'night' ? 
                              (Math.random() > 0.3 ? "bg-yellow-300" : "bg-gray-700") :
                              "bg-cyan-200 opacity-70"
                          )}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Roof details for taller buildings */}
              {currentHeight > 60 && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-2 h-2 bg-red-500 rounded-sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Construction Crane for growing stages */}
      {progress >= 40 && progress < 90 && (
        <div className="absolute bottom-8 right-8 opacity-70">
          <div className="w-1 h-16 bg-yellow-500 rounded-t-lg" />
          <div className="absolute top-0 right-0 w-8 h-0.5 bg-yellow-500" />
          <div className="absolute top-0 right-8 w-0.5 h-4 bg-yellow-500" />
        </div>
      )}

      {/* Traffic */}
      {progress >= 50 && (
        <div className="absolute bottom-1 w-full flex justify-between px-4">
          <div className="w-2 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="w-2 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="w-2 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        </div>
      )}

      {/* Helicopter for high progress */}
      {progress >= 80 && (
        <div className="absolute top-12 left-1/4 animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="text-sm">🚁</div>
        </div>
      )}

      {/* Fireworks for completion */}
      {stage === 'magnificent' && (
        <div className="absolute top-8 w-full flex justify-center gap-8">
          <div className="animate-ping w-3 h-3 rounded-full bg-red-400" />
          <div className="animate-ping w-3 h-3 rounded-full bg-blue-400" style={{ animationDelay: '0.5s' }} />
          <div className="animate-ping w-3 h-3 rounded-full bg-green-400" style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Stars for night */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse"
              style={{
                left: `${10 + (i * 7)}%`,
                top: `${5 + (i % 4) * 8}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CityTheme;
