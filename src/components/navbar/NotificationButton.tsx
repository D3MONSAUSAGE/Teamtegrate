
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/use-notifications';
import NotificationContent from './NotificationContent';

interface NotificationButtonProps {
  onNotificationsOpen: () => void;
  onNotificationClick: (notificationType: string) => void;
  formatNotificationTime: (timestamp: string) => string;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ 
  onNotificationsOpen, 
  onNotificationClick, 
  formatNotificationTime 
}) => {
  const { unreadCount, markAsRead } = useNotifications();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Notifications" onClick={onNotificationsOpen}>
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
            <NotificationContent 
              onNotificationClick={onNotificationClick}
              formatNotificationTime={formatNotificationTime}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Notifications" onClick={onNotificationsOpen}>
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
        <NotificationContent 
          onNotificationClick={onNotificationClick}
          formatNotificationTime={formatNotificationTime}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationButton;
