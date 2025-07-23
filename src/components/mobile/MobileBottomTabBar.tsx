
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useNotifications } from '@/hooks/use-notifications';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  route: string;
  badge?: number;
}

const MobileBottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Home', icon: Home, route: '/dashboard' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, route: '/tasks' },
    { id: 'projects', label: 'Projects', icon: Briefcase, route: '/projects' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, route: '/calendar' },
    { id: 'profile', label: 'Profile', icon: User, route: '/profile', badge: unreadCount },
  ];

  const handleTabPress = async (route: string) => {
    // Add haptic feedback
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }

    navigate(route);
  };

  const isActive = (route: string) => {
    return location.pathname === route || 
           (route === '/dashboard' && location.pathname === '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.route);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.route)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-2 transition-all duration-200 active:scale-95",
                "rounded-lg hover:bg-accent/20"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomTabBar;
