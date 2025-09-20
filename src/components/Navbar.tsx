
import React, { useEffect, memo, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@/lib/notifications';
import { useNotifications } from '@/hooks/use-notifications';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import NavbarBrand from './navbar/NavbarBrand';
import NotificationButton from './navbar/NotificationButton';
import UserMenu from './navbar/UserMenu';

const Navbar = memo(() => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { markAsRead, fetchNotifications } = useNotifications();
  const { isMobile } = useSidebar();

  // Remove duplicate notification fetch - handled in useNotifications hook

  // Memoize handlers to prevent unnecessary re-renders
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
      notifications.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  }, [logout, navigate]);

  const handleSettings = useCallback(() => {
    navigate('/dashboard/settings');
  }, [navigate]);

  const handleNotificationsOpen = useCallback(() => {
    console.log("Opening notifications panel");
  }, []);

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

  const formatNotificationTime = useMemo(() => (timestamp: string) => {
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

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 safe-area-top">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Show sidebar trigger on all screen sizes */}
          <SidebarTrigger className="h-10 w-10 native-button tap-highlight-none" />
          <NavbarBrand />
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <NotificationButton 
            onNotificationsOpen={handleNotificationsOpen}
            onNotificationClick={handleNotificationClick}
            formatNotificationTime={formatNotificationTime}
          />

          <UserMenu 
            onLogout={handleLogout}
            onSettings={handleSettings}
          />
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
