
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      path: '/dashboard/tasks',
      isActive: location.pathname.includes('/tasks')
    },
    {
      icon: Calendar,
      label: 'Calendar',
      path: '/dashboard/calendar',
      isActive: location.pathname.includes('/calendar')
    },
    {
      icon: Users,
      label: 'Team',
      path: '/dashboard/team',
      isActive: location.pathname.includes('/team')
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/dashboard/settings',
      isActive: location.pathname.includes('/settings')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 pb-safe z-40">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                item.isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
