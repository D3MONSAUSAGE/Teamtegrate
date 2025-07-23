
import React from 'react';
import { Calendar, Clock, FolderOpen } from 'lucide-react';

interface QuickStatsRowProps {
  todaysCount: number;
  upcomingCount: number;
  projectsCount: number;
}

const QuickStatsRow: React.FC<QuickStatsRowProps> = ({ 
  todaysCount, 
  upcomingCount, 
  projectsCount 
}) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Today's Tasks</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todaysCount}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-orange-600 mr-2" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingCount}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <FolderOpen className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{projectsCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsRow;
