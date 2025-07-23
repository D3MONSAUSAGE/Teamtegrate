
import React from 'react';
import { Home, CheckSquare, Users, Settings, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '@/components/ui/enhanced-button';

interface MobileBottomNavProps {
  onCreateTask?: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onCreateTask }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/dashboard'
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      path: '/dashboard/tasks'
    },
    {
      icon: Users,
      label: 'Team',
      path: '/dashboard/team'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/dashboard/settings'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 safe-area-bottom">
      <div className="grid grid-cols-5 h-16 mobile-px-safe items-center">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200 mobile-touch-target mobile-no-select",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium mobile-text-sm line-clamp-1">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Central Create Button */}
        <div className="flex justify-center">
          <EnhancedButton
            size="icon"
            onClick={onCreateTask}
            className={cn(
              "w-12 h-12 rounded-full shadow-lg border-0",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-all duration-200 hover:scale-110 active:scale-95",
              "transform-gpu will-change-transform"
            )}
            ripple={true}
            haptic={true}
          >
            <Plus className="h-6 w-6" />
          </EnhancedButton>
        </div>

        {/* Last two nav items */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200 mobile-touch-target mobile-no-select",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium mobile-text-sm line-clamp-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
