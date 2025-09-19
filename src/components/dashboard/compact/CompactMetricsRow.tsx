import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  TrendingUp,
  Timer,
  Play,
  Pause
} from 'lucide-react';
import { Task } from '@/types';
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';

interface CompactMetricsRowProps {
  dailyScore: number;
  todaysTasks: Task[];
  overdueTasks: Task[];
}

const CompactMetricsRow: React.FC<CompactMetricsRowProps> = ({
  dailyScore,
  todaysTasks,
  overdueTasks
}) => {
  const { sessionState } = useEnhancedTimeTracking();
  
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const highPriorityTasks = todaysTasks.filter(task => task.priority === 'High').length;
  
  const getClockStatus = () => {
    if (sessionState.isOnBreak) {
      return {
        text: 'On Break',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        icon: Pause,
        time: formatHoursMinutes(sessionState.breakElapsedMinutes)
      };
    } else if (sessionState.isActive) {
      return {
        text: 'Working',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        icon: Play,
        time: formatHoursMinutes(sessionState.workElapsedMinutes)
      };
    } else {
      return {
        text: 'Clocked Out',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        icon: Clock,
        time: '0h 0m'
      };
    }
  };

  const clockStatus = getClockStatus();
  const ClockIcon = clockStatus.icon;

  const metrics = [
    {
      title: 'Daily Score',
      value: `${dailyScore}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      description: 'Productivity'
    },
    {
      title: 'Completed',
      value: `${completedToday}/${todaysTasks.length}`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      description: 'Today\'s tasks'
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: overdueTasks.length > 0 ? 'text-red-600' : 'text-gray-500',
      bgColor: overdueTasks.length > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-950/20',
      description: 'Need attention'
    },
    {
      title: clockStatus.text,
      value: clockStatus.time,
      icon: ClockIcon,
      color: clockStatus.color,
      bgColor: clockStatus.bgColor,
      description: 'Current status'
    },
    {
      title: 'High Priority',
      value: highPriorityTasks,
      icon: Zap,
      color: highPriorityTasks > 0 ? 'text-purple-600' : 'text-gray-500',
      bgColor: highPriorityTasks > 0 ? 'bg-purple-50 dark:bg-purple-950/20' : 'bg-gray-50 dark:bg-gray-950/20',
      description: 'Urgent tasks'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.title}
            className={`p-3 hover:shadow-md transition-all duration-200 cursor-pointer group ${metric.bgColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-4 w-4 ${metric.color} group-hover:scale-110 transition-transform`} />
              {metric.title === 'Overdue' && overdueTasks.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1 py-0">!</Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className={`text-lg font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.description}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CompactMetricsRow;