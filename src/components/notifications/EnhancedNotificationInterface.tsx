import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Award,
  Clock,
  FileText,
  MailOpen,
  Trash2
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'training_assigned' | 'training_completed' | 'request_submitted' | 'request_approved' | 'request_rejected' | 'daily_email' | 'reminder';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
    case 'request_approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'error':
    case 'request_rejected':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'training_assigned':
    case 'training_completed':
      return <Award className="h-4 w-4 text-blue-600" />;
    case 'request_submitted':
      return <FileText className="h-4 w-4 text-purple-600" />;
    case 'reminder':
      return <Clock className="h-4 w-4 text-orange-600" />;
    case 'daily_email':
      return <Bell className="h-4 w-4 text-blue-600" />;
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
    case 'request_approved':
      return 'border-l-green-500 bg-green-50';
    case 'error':
    case 'request_rejected':
      return 'border-l-red-500 bg-red-50';
    case 'warning':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'training_assigned':
    case 'training_completed':
      return 'border-l-blue-500 bg-blue-50';
    case 'request_submitted':
      return 'border-l-purple-500 bg-purple-50';
    case 'reminder':
      return 'border-l-orange-500 bg-orange-50';
    case 'daily_email':
      return 'border-l-cyan-500 bg-cyan-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'training_assigned':
      return 'Training Assigned';
    case 'training_completed':
      return 'Training Completed';
    case 'request_submitted':
      return 'Request Submitted';
    case 'request_approved':
      return 'Request Approved';
    case 'request_rejected':
      return 'Request Rejected';
    case 'daily_email':
      return 'Daily Summary';
    case 'reminder':
      return 'Reminder';
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    default:
      return 'Info';
  }
};

export const EnhancedNotificationInterface: React.FC = () => {
  const { triggerTestNotification } = useRealtimeNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'training' | 'requests'>('all');
  
  // Mock notifications for now - replace with actual hook when available
  const notifications: Notification[] = [];
  const isLoading = false;
  
  const markAsRead = async (notificationId: string) => {
    console.log('Mark as read:', notificationId);
  };
  
  const deleteNotification = async (notificationId: string) => {
    console.log('Delete notification:', notificationId);
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'training':
        return notification.type.includes('training');
      case 'requests':
        return notification.type.includes('request');
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === 'training' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('training')}
        >
          Training ({notifications.filter(n => n.type.includes('training')).length})
        </Button>
        <Button
          variant={filter === 'requests' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('requests')}
        >
          Requests ({notifications.filter(n => n.type.includes('request')).length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found.</p>
                <p className="text-sm mt-2">New notifications will appear here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 transition-colors hover:bg-muted/50 ${getNotificationColor(notification.type)} ${
                      !notification.is_read ? 'bg-opacity-100' : 'bg-opacity-30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type)}
                          <span className="font-medium">{notification.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          
                          <div className="flex gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="h-7 px-2"
                              >
                                <MailOpen className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="h-7 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Display metadata if available */}
                        {notification.metadata && (
                          <div className="mt-2 p-2 rounded bg-white/50 border">
                            <p className="text-xs font-medium">Additional Details:</p>
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {JSON.stringify(notification.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNotificationInterface;