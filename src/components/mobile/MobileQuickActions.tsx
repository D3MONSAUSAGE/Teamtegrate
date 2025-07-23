
import React from 'react';
import { Plus, Calendar, Timer, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
}

interface MobileQuickActionsProps {
  onNewTask: () => void;
  onCalendar: () => void;
  onTimer: () => void;
  onReports: () => void;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onNewTask,
  onCalendar,
  onTimer,
  onReports
}) => {
  const handleActionPress = async (action: () => void) => {
    // Add haptic feedback
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    action();
  };

  const actions: QuickAction[] = [
    {
      id: 'new-task',
      label: 'New Task',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      onClick: () => handleActionPress(onNewTask)
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      onClick: () => handleActionPress(onCalendar)
    },
    {
      id: 'timer',
      label: 'Timer',
      icon: Timer,
      color: 'from-purple-500 to-purple-600',
      onClick: () => handleActionPress(onTimer)
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      onClick: () => handleActionPress(onReports)
    }
  ];

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                "h-16 p-4 rounded-xl border-0 shadow-lg transition-all duration-300",
                "bg-gradient-to-r hover:shadow-xl active:scale-95",
                action.color,
                "text-white font-medium"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{action.label}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileQuickActions;
