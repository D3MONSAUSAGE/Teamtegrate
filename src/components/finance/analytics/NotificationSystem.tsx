import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, X, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  category: 'batch_processing' | 'validation' | 'analytics' | 'system' | 'alert';
  actionable?: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface NotificationSystemProps {
  className?: string;
  maxNotifications?: number;
  autoMarkReadDelay?: number; // seconds
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  className,
  maxNotifications = 50,
  autoMarkReadDelay = 30
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  // Simulate real-time notifications
  useEffect(() => {
    const generateMockNotifications = () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Batch Processing Complete',
          message: 'Successfully processed 25 sales files from POS upload',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          isRead: false,
          category: 'batch_processing',
          priority: 'medium',
          actionable: true,
          actionUrl: '/finance/daily-sales'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Validation Warning',
          message: 'Detected 3 potential anomalies in labor cost calculations for Store #124',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          isRead: false,
          category: 'validation',
          priority: 'high',
          actionable: true
        },
        {
          id: '3',
          type: 'info',
          title: 'Analytics Update',
          message: 'Weekly performance report is now available with new insights',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isRead: true,
          category: 'analytics',
          priority: 'low'
        },
        {
          id: '4',
          type: 'error',
          title: 'Processing Failed',
          message: 'Failed to process 2 files due to invalid format. Manual review required.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          isRead: false,
          category: 'batch_processing',
          priority: 'critical',
          actionable: true
        },
        {
          id: '5',
          type: 'warning',
          title: 'High Labor Costs Alert',
          message: 'Location "Downtown Store" exceeded 35% labor cost threshold',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          isRead: false,
          category: 'alert',
          priority: 'high',
          actionable: true
        }
      ];
      
      setNotifications(mockNotifications);
    };

    generateMockNotifications();
  }, []);

  // Auto-mark notifications as read after delay
  useEffect(() => {
    if (!autoMarkReadDelay) return;

    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.map(notification => {
          const ageInSeconds = (Date.now() - notification.timestamp.getTime()) / 1000;
          if (!notification.isRead && ageInSeconds > autoMarkReadDelay) {
            return { ...notification, isRead: true };
          }
          return notification;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoMarkReadDelay]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'high':
        return notification.priority === 'high' || notification.priority === 'critical';
      default:
        return true;
    }
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[priority]} className="text-xs">
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "Your notification inbox is now clear."
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast({
      title: "All notifications cleared",
      description: "Your notification history has been cleared."
    });
  };

  // Add real-time notification listener
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, maxNotifications - 1)]);
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });
    }
  };

  // Expose addNotification function globally for other components
  useEffect(() => {
    (window as any).addNotification = addNotification;
    return () => {
      delete (window as any).addNotification;
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell Trigger */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] z-50 shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-2">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'high' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('high')}
              >
                High Priority
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-1 p-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications found</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                          !notification.isRead && "bg-primary/5 border border-primary/20"
                        )}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{notification.title}</p>
                              {getPriorityBadge(notification.priority)}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{format(notification.timestamp, 'MMM dd, h:mm a')}</span>
                              <div className="flex gap-1">
                                {notification.actionable && (
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                    View
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < filteredNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="w-full text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSystem;