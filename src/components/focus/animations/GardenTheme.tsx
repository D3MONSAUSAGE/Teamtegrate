
import React from 'react';
import { cn } from '@/lib/utils';

interface GardenThemeProps {
  progress: number;
  stage: string;
  isActive: boolean;
  timeOfDay: string;
}

const GardenTheme: React.FC<GardenThemeProps> = ({ progress, stage, isActive, timeOfDay }) => {
  const getTimeGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-pink-200 via-orange-100 to-yellow-200';
      case 'evening':
        return 'from-purple-300 via-pink-200 to-orange-300';
      case 'night':
        return 'from-indigo-900 via-purple-800 to-blue-900';
      default:
        return 'from-blue-300 via-green-100 to-yellow-100';
    }
  };

  const getStemHeight = () => Math.max(20, 20 + (progress / 100) * 80);
  const getFlowerSize = () => Math.max(16, 16 + (progress / 100) * 48);
  const getPetalCount = () => Math.max(6, Math.floor(6 + (progress / 100) * 6));

  return (
    <div className="absolute inset-0">
      {/* Sky Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b transition-all duration-1000", getTimeGradient())} />
      
      {/* Garden Fence */}
      <div className="absolute bottom-20 w-full h-8 flex justify-center">
        <div className="w-3/4 border-t-2 border-amber-600 relative">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute top-0 w-1 h-6 bg-amber-600 rounded-t-sm"
              style={{ left: `${i * 12}%` }}
            />
          ))}
        </div>
      </div>

      {/* Rich Soil */}
      <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-lg">
        {/* Soil texture */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-800 rounded-full"
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 80 + 10}%`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Flower */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-all duration-1000">
        {/* Stem */}
        <div 
          className={cn(
            "w-2 bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg mx-auto transition-all duration-700",
            stage === 'seed' && "w-1 h-2 bg-amber-800 rounded-full"
          )}
          style={{
            height: `${getStemHeight()}px`,
            minHeight: stage === 'seed' ? '4px' : '20px'
          }}
        />
        
        {/* Flower Head */}
        {progress >= 25 && (
          <div className="relative">
            <div 
              className="absolute -top-2 left-1/2 transform -translate-x-1/2"
              style={{
                width: `${getFlowerSize()}px`,
                height: `${getFlowerSize()}px`
              }}
            >
              {/* Petals */}
              {[...Array(getPetalCount())].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute bg-gradient-to-t rounded-full transition-all duration-500",
                    isActive && "animate-pulse"
                  )}
                  style={{
                    width: '8px',
                    height: '16px',
                    transform: `rotate(${i * (360 / getPetalCount())}deg) translateY(-50%)`,
                    transformOrigin: 'center bottom',
                    top: '50%',
                    left: '50%',
                    marginLeft: '-4px',
                    background: `linear-gradient(to top, ${
                      ['#f472b6', '#ec4899', '#db2777', '#be185d', '#f97316', '#ea580c'][i % 6]
                    }, ${
                      ['#fce7f3', '#fdf2f8', '#fef7ff', '#fff1f2', '#fff7ed', '#fef3c7'][i % 6]
                    })`,
                    animationDuration: '2s'
                  }}
                />
              ))}
              
              {/* Flower Center */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full transition-all duration-500 border-2 border-yellow-300" />
            </div>
          </div>
        )}

        {/* Leaves */}
        {progress >= 40 && (
          <>
            <div 
              className="absolute bottom-8 -left-3 w-6 h-3 bg-green-500 rounded-full transform rotate-45 transition-all duration-700"
              style={{ transformOrigin: 'bottom right' }}
            />
            <div 
              className="absolute bottom-12 -right-3 w-6 h-3 bg-green-500 rounded-full transform -rotate-45 transition-all duration-700"
              style={{ transformOrigin: 'bottom left' }}
            />
          </>
        )}
      </div>

      {/* Garden Companions */}
      {progress >= 30 && (
        <div className="absolute bottom-20 left-1/4 transform -translate-x-1/2">
          <div className="w-1 h-12 bg-green-600 rounded-t-lg mx-auto" />
          <div className="relative">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-4 bg-purple-400 rounded-full"
                  style={{
                    transform: `rotate(${i * 72}deg) translateY(-50%)`,
                    transformOrigin: 'center bottom',
                    top: '50%',
                    left: '50%',
                    marginLeft: '-1px'
                  }}
                />
              ))}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-300 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {progress >= 50 && (
        <div className="absolute bottom-20 right-1/4 transform translate-x-1/2">
          <div className="w-1 h-8 bg-green-600 rounded-t-lg mx-auto" />
          <div className="relative">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-3 bg-white rounded-full"
                  style={{
                    transform: `rotate(${i * 60}deg) translateY(-50%)`,
                    transformOrigin: 'center bottom',
                    top: '50%',
                    left: '50%',
                    marginLeft: '-0.5px'
                  }}
                />
              ))}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-300 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Butterflies and Bees */}
      {progress >= 60 && (
        <>
          <div className="absolute top-16 left-1/3 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="text-lg">🦋</div>
          </div>
          <div className="absolute top-20 right-1/3 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>
            <div className="text-sm">🐝</div>
          </div>
        </>
      )}

      {/* Garden Tools */}
      {progress >= 80 && (
        <div className="absolute bottom-4 right-4 opacity-70">
          <div className="flex gap-1">
            <div className="w-1 h-8 bg-amber-600 rounded-full" />
            <div className="w-1 h-6 bg-gray-400 rounded-full" />
          </div>
        </div>
      )}

      {/* Morning Dew Effect */}
      {timeOfDay === 'morning' && progress >= 20 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-60 animate-pulse"
              style={{
                left: `${20 + (i * 8)}%`,
                top: `${60 + (i % 3) * 5}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GardenTheme;
