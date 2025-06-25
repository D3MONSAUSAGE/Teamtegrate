
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface HeatmapData {
  date: Date;
  value: number;
  level: number; // 0-4 intensity level
}

interface ProductivityHeatmapProps {
  data: HeatmapData[];
  weeks?: number;
}

const ProductivityHeatmap: React.FC<ProductivityHeatmapProps> = ({ 
  data, 
  weeks = 12 
}) => {
  const today = new Date();
  const startDate = addDays(startOfWeek(today), -weeks * 7);
  
  const getIntensityColor = (level: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800', // 0 - no activity
      'bg-green-200 dark:bg-green-900', // 1 - low
      'bg-green-300 dark:bg-green-700', // 2 - medium
      'bg-green-500 dark:bg-green-600', // 3 - high
      'bg-green-700 dark:bg-green-400'  // 4 - very high
    ];
    return colors[level] || colors[0];
  };

  const getDayData = (date: Date) => {
    return data.find(d => isSameDay(d.date, date));
  };

  const renderWeeks = () => {
    const weeks = [];
    for (let week = 0; week < 12; week++) {
      const weekStart = addDays(startDate, week * 7);
      const days = [];
      
      for (let day = 0; day < 7; day++) {
        const currentDate = addDays(weekStart, day);
        const dayData = getDayData(currentDate);
        const level = dayData?.level || 0;
        
        days.push(
          <div
            key={currentDate.toISOString()}
            className={`w-3 h-3 rounded-sm ${getIntensityColor(level)} border border-gray-200 dark:border-gray-700`}
            title={`${format(currentDate, 'MMM dd, yyyy')}: ${dayData?.value || 0} tasks completed`}
          />
        );
      }
      
      weeks.push(
        <div key={week} className="flex flex-col gap-1">
          {days}
        </div>
      );
    }
    return weeks;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          <CardTitle className="text-lg">Activity Heatmap</CardTitle>
        </div>
        <CardDescription>
          Daily task completion activity over the last {weeks} weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Days of week labels */}
          <div className="flex gap-4">
            <div className="w-12 text-xs text-muted-foreground">
              {/* Empty space for week labels */}
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="h-3 flex items-center">Mon</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Wed</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Fri</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Sun</div>
            </div>
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto">
            {renderWeeks()}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(level)} border border-gray-200 dark:border-gray-700`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductivityHeatmap;
