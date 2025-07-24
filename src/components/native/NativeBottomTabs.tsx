
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-20 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 h-full rounded-2xl transition-all duration-300 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[56px] min-w-[56px]",
                "relative overflow-hidden",
                active 
                  ? "text-primary bg-primary/15 shadow-sm scale-105" 
                  : "text-muted-foreground active:bg-muted/30"
              )}
            >
              {/* Active indicator background */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl" />
              )}
              
              {/* Icon container with enhanced padding */}
              <div className="relative flex flex-col items-center justify-center space-y-1 z-10">
                <div className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-300",
                  active && "bg-primary/10 shadow-sm"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-300", 
                    active ? "text-primary scale-110" : "text-muted-foreground"
                  )} />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-md">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                
                {/* Enhanced label with better typography */}
                <span className={cn(
                  "text-xs font-medium tracking-wide transition-all duration-300",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

NativeBottomTabs.displayName = 'NativeBottomTabs';

export default NativeBottomTabs;
