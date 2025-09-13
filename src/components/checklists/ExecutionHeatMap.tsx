import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Users } from 'lucide-react';

interface ExecutionData {
  hour: number;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  teams: number;
}

interface ExecutionHeatMapProps {
  data: ExecutionData[];
}

export const ExecutionHeatMap: React.FC<ExecutionHeatMapProps> = ({ data }) => {
  const getHeatColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 75) return 'bg-yellow-500';
    if (rate >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHeatIntensity = (rate: number) => {
    const opacity = Math.max(0.2, rate / 100);
    return { opacity };
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const currentHour = new Date().getHours();
  const peakHour = data.length > 0 ? data.reduce((prev, current) => 
    prev.completionRate > current.completionRate ? prev : current
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Daily Execution Heat Map
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Peak: {peakHour ? formatHour(peakHour.hour) : 'N/A'} ({peakHour?.completionRate.toFixed(1)}%)
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {data.reduce((sum, d) => sum + d.teams, 0)} Teams Active
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <span>Completion Rate:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>&lt;50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>50-75%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>75-90%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>&gt;90%</span>
            </div>
          </div>

          {/* Heat Map Grid */}
          <div className="grid grid-cols-12 gap-1">
            {data.map((hourData) => (
              <div
                key={hourData.hour}
                className="relative group"
              >
                <div
                  className={`w-full h-16 rounded ${getHeatColor(hourData.completionRate)} cursor-pointer transition-all duration-200 hover:scale-105`}
                  style={getHeatIntensity(hourData.completionRate)}
                >
                  {hourData.hour === currentHour && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg border text-xs whitespace-nowrap">
                    <div className="font-semibold">{formatHour(hourData.hour)}</div>
                    <div>Rate: {hourData.completionRate.toFixed(1)}%</div>
                    <div>Tasks: {hourData.completedTasks}/{hourData.totalTasks}</div>
                    <div>Teams: {hourData.teams}</div>
                  </div>
                </div>
                
                <div className="text-xs text-center mt-1 text-muted-foreground">
                  {formatHour(hourData.hour)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.reduce((sum, d) => sum + d.completedTasks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.length > 0 ? (
                  data.reduce((sum, d) => sum + d.completionRate, 0) / data.length
                ).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.max(...data.map(d => d.teams), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Peak Teams</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};