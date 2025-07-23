
import React, { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  CheckSquare, 
  Clock, 
  User, 
  Grid3X3,
  Bell
} from 'lucide-react';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { isTaskOverdue } from '@/utils/taskUtils';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const MobileBottomTabBar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks } = usePersonalTasks();
  
  // Calculate badge counts
  const todaysTasks = tasks.filter(task => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  }).length;

  const overdueTasks = tasks.filter(task => isTaskOverdue(task)).length;
  const totalTaskBadge = todaysTasks + overdueTasks;

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      path: '/',
      badge: 0
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      path: '/tasks',
      badge: totalTaskBadge
    },
    {
      id: 'time',
      label: 'Time',
      icon: Clock,
      path: '/time-tracking'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile'
    },
    {
      id: 'more',
      label: 'More',
      icon: Grid3X3,
      path: '/more'
    }
  ];

  const handleTabPress = (tab: TabItem) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    navigate(tab.path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/60 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 relative min-w-[60px]",
                active 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-1" />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

MobileBottomTabBar.displayName = 'MobileBottomTabBar';

export default MobileBottomTabBar;
