
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/use-notifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NavbarBrand from './navbar/NavbarBrand';
import NotificationButton from './navbar/NotificationButton';
import UserMenu from './navbar/UserMenu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { markAsRead, fetchNotifications } = useNotifications();
  const isMobile = useIsMobile();

  // Refresh notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  const handleNotificationsOpen = () => {
    fetchNotifications();
    console.log("Opening notifications");
  };

  const handleNotificationClick = (notificationType: string) => {
    if (notificationType.includes('task')) {
      navigate('/dashboard/tasks');
    } else if (notificationType.includes('chat')) {
      navigate('/dashboard/chat');
    } else if (notificationType.includes('project')) {
      navigate('/dashboard/projects');
    }
    markAsRead();
  };

  const formatNotificationTime = (timestamp: string) => {
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
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 py-4 pl-3 md:pl-6 pr-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9" />
        <NavbarBrand />
      </div>

      <div className="flex items-center space-x-4">
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
    </nav>
  );
};

export default Navbar;
