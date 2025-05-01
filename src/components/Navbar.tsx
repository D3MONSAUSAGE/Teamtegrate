
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Settings, Bell, BellRing } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/use-notifications';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotifications();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      const fetchAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching user avatar:', error);
            return;
          }

          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching avatar:', error);
        }
      };

      fetchAvatar();
    }
  }, [user]);

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
    fetchNotifications(); // Refresh notifications when opened
    console.log("Opening notifications, current count:", unreadCount);
    // Don't mark as read immediately, let the user see which ones are new
  };

  const handleNotificationClick = (notificationType: string) => {
    // Navigate based on notification type
    if (notificationType.includes('task')) {
      navigate('/dashboard/tasks');
    } else if (notificationType.includes('chat')) {
      navigate('/dashboard/chat');
    }
    // Mark all as read when user interacts with notifications
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

  const NotificationContent = () => (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications && notifications.length > 0 ? (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex flex-col items-start gap-0.5 py-2 px-3 cursor-pointer border-b last:border-b-0 ${!notification.read ? 'bg-primary/5' : ''}`}
            onClick={() => handleNotificationClick(notification.type)}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                {notification.title}
                {!notification.read && <span className="ml-2 w-2 h-2 rounded-full bg-primary inline-block"></span>}
              </span>
              <span className="text-xs text-muted-foreground">{formatNotificationTime(notification.created_at)}</span>
            </div>
            <span className="text-sm">{notification.content}</span>
            {notification.type === 'chat_invitation' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-1 h-7 text-xs text-primary"
                onClick={() => navigate('/dashboard/chat')}
              >
                Go to Chat
              </Button>
            )}
            {notification.type === 'task_assignment' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-1 h-7 text-xs text-primary"
                onClick={() => navigate('/dashboard/tasks')}
              >
                View Task
              </Button>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">No notifications</div>
      )}
    </div>
  );

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4 md:space-x-0">
        <Link to="/" className="text-xl font-bold text-primary ml-10 md:ml-0">TeamStream</Link>
      </div>

      <div className="flex items-center space-x-4">
        {isMobile ? (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Notifications" onClick={handleNotificationsOpen}>
                {unreadCount > 0 ? (
                  <BellRing className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <div className="px-3 py-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="sm" onClick={() => markAsRead()}>
                      Mark all as read
                    </Button>
                  </DrawerClose>
                </div>
                <NotificationContent />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Notifications" onClick={handleNotificationsOpen}>
                {unreadCount > 0 ? (
                  <BellRing className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex justify-between items-center px-3 pt-2 pb-1">
                <div className="text-sm font-semibold">Notifications</div>
                <Button variant="ghost" size="sm" onClick={() => markAsRead()} className="h-7 text-xs">
                  Mark all as read
                </Button>
              </div>
              <DropdownMenuSeparator />
              <NotificationContent />
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <span className="text-sm text-gray-600 dark:text-gray-300 mr-2 hidden md:inline">
          {user.role === 'manager' ? 'Manager' : 'Team Member'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary text-white">
                  {user.name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{user.name}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 text-red-500" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
