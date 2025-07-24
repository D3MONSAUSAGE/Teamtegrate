
import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-notifications';
import NotificationButton from '../navbar/NotificationButton';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NativeHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  onMenuPress?: () => void;
  className?: string;
  rightContent?: React.ReactNode;
}

const NativeHeader: React.FC<NativeHeaderProps> = memo(({
  title,
  showBack = false,
  showMenu = false,
  showNotifications = true,
  onMenuPress,
  className,
  rightContent
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markAsRead, fetchNotifications } = useNotifications();

  const handleBack = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available, continue silently
    }
    navigate(-1);
  }, [navigate]);

  const handleMenu = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available, continue silently
    }
    onMenuPress?.();
  }, [onMenuPress]);

  const handleNotificationsOpen = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = useCallback((notificationType: string) => {
    if (notificationType.includes('task')) {
      navigate('/dashboard/tasks');
    } else if (notificationType.includes('chat')) {
      navigate('/dashboard/chat');
    } else if (notificationType.includes('project')) {
      navigate('/dashboard/projects');
    }
    markAsRead();
  }, [navigate, markAsRead]);

  const formatNotificationTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  return (
    <div className={cn(
      "flex items-center justify-between h-16 px-5 bg-background/95 backdrop-blur-md border-b border-border/30 shadow-sm safe-area-top",
      className
    )}>
      {/* Left side with enhanced spacing */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-11 w-11 -ml-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {showMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenu}
            className="h-11 w-11 -ml-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Enhanced title with better typography */}
        <h1 className="text-xl font-bold tracking-tight truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {title}
        </h1>
      </div>

      {/* Right side with improved spacing */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {rightContent}
        
        {showNotifications && user && (
          <div className="relative">
            <NotificationButton
              onNotificationsOpen={handleNotificationsOpen}
              onNotificationClick={handleNotificationClick}
              formatNotificationTime={formatNotificationTime}
            />
          </div>
        )}
      </div>
    </div>
  );
});

NativeHeader.displayName = 'NativeHeader';

export default NativeHeader;
