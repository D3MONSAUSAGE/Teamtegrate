
import React, { memo } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const MobileHeader = memo(() => {
  const location = useLocation();
  const { user } = useAuth();

  // Get page title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/tasks':
        return 'Tasks';
      case '/time-tracking':
        return 'Time Tracking';
      case '/profile':
        return 'Profile';
      case '/more':
        return 'More';
      default:
        return 'TeamTegrate';
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border/60 px-4 py-3 safe-area-top">
      {isHomePage ? (
        // Special header for homepage with greeting
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Standard header for other pages
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
});

MobileHeader.displayName = 'MobileHeader';

export default MobileHeader;
