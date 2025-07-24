
import React, { memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Clock, 
  MessageCircle, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const tabs: TabItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/dashboard/tasks' },
  { id: 'time', label: 'Time', icon: Clock, path: '/dashboard/time-tracking' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, path: '/dashboard/chat' },
  { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' }
];

const NativeBottomTabs: React.FC = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabPress = useCallback(async (tab: TabItem) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available, continue silently
    }
    
    if (location.pathname !== tab.path) {
      navigate(tab.path);
    }
  }, [navigate, location.pathname]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  }, [location.pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 h-full rounded-lg transition-all duration-200 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

NativeBottomTabs.displayName = 'NativeBottomTabs';

export default NativeBottomTabs;
