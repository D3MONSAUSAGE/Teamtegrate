
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/use-notifications';
import { Check } from 'lucide-react';

interface NotificationContentProps {
  onNotificationClick: (notificationType: string) => void;
  formatNotificationTime: (timestamp: string) => string;
}

const NotificationContent: React.FC<NotificationContentProps> = ({ 
  onNotificationClick, 
  formatNotificationTime 
}) => {
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const getActionButton = (notificationType: string) => {
    switch (notificationType) {
      case 'chat_message':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/chat')}
          >
            Go to Chat
          </Button>
        );
      case 'task_assignment':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/tasks')}
          >
            View Task
          </Button>
        );
      case 'project_team_addition':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/projects')}
          >
            View Projects
          </Button>
        );
      case 'chat_invitation':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/chat')}
          >
            Go to Chat
          </Button>
        );
      case 'bug_report':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/settings')}
          >
            View Bug Reports
          </Button>
        );
      case 'correction_request':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/time')}
          >
            View Time Entries
          </Button>
        );
      case 'meeting_invitation':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/meetings')}
          >
            View Meeting
          </Button>
        );
      case 'reminder':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/tasks')}
          >
            View Tasks
          </Button>
        );
      case 'schedule_assignment':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard/schedule')}
          >
            View Schedule
          </Button>
        );
      case 'info':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 h-7 text-xs text-primary"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </Button>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Navigate based on type
    onNotificationClick(notification.type);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications && notifications.length > 0 ? (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex flex-col items-start gap-0.5 py-2 px-3 cursor-pointer border-b last:border-b-0 ${!notification.read ? 'bg-primary/5' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                {notification.title}
                {!notification.read && <span className="ml-2 w-2 h-2 rounded-full bg-primary inline-block"></span>}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatNotificationTime(notification.created_at)}</span>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={(e) => handleMarkAsRead(e, notification.id)}
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <span className="text-sm">{notification.content}</span>
            {getActionButton(notification.type)}
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">No notifications</div>
      )}
    </div>
  );
};

export default NotificationContent;
