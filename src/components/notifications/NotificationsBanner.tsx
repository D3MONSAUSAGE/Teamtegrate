
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { format } from 'date-fns';

const NotificationsBanner: React.FC = () => {
  const { notifications, markAsRead, unreadCount } = useNotifications();

  // Show only recent unread notifications (last 5)
  const recentNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 5);

  if (recentNotifications.length === 0) return null;

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">
              Recent Notifications
            </h3>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              {unreadCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAsRead()}
            className="text-orange-600 hover:text-orange-800"
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
        
        <div className="space-y-2">
          {recentNotifications.map(notification => (
            <div
              key={notification.id}
              className="flex items-start justify-between p-3 bg-white rounded-lg border border-orange-100"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {notification.type}
                  </Badge>
                </div>
                {notification.content && (
                  <p className="text-sm text-gray-600 mb-2">{notification.content}</p>
                )}
                <p className="text-xs text-gray-500">
                  {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsBanner;
