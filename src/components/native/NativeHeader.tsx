
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
      "flex items-center justify-between h-14 px-4 bg-background border-b border-border safe-area-top",
      className
    )}>
      {/* Left side */}
      <div className="flex items-center space-x-2">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {showMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenu}
            className="h-10 w-10 -ml-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2">
        {rightContent}
        
        {showNotifications && user && (
          <NotificationButton
            onNotificationsOpen={handleNotificationsOpen}
            onNotificationClick={handleNotificationClick}
            formatNotificationTime={formatNotificationTime}
          />
        )}
      </div>
    </div>
  );
});

NativeHeader.displayName = 'NativeHeader';

export default NativeHeader;
