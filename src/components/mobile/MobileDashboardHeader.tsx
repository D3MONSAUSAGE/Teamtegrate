
import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MobileDashboardHeaderProps {
  onSearchFocus?: () => void;
  onNotificationPress?: () => void;
  className?: string;
}

const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({
  onSearchFocus,
  onNotificationPress,
  className
}) => {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={cn("bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe-area-inset-top", className)}>
      <div className="px-4 py-4 space-y-4">
        {/* Top Row - Profile and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {greeting()}, {user?.name || 'User'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNotificationPress}
              className="h-9 w-9 p-0 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, projects..."
            className="pl-10 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            onFocus={onSearchFocus}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardHeader;
