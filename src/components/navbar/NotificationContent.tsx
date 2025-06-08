
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/use-notifications';

interface NotificationContentProps {
  onNotificationClick: (notificationType: string) => void;
  formatNotificationTime: (timestamp: string) => string;
}

const NotificationContent: React.FC<NotificationContentProps> = ({ 
  onNotificationClick, 
  formatNotificationTime 
}) => {
  const { notifications } = useNotifications();
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
      default:
        return null;
    }
  };

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications && notifications.length > 0 ? (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex flex-col items-start gap-0.5 py-2 px-3 cursor-pointer border-b last:border-b-0 ${!notification.read ? 'bg-primary/5' : ''}`}
            onClick={() => onNotificationClick(notification.type)}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                {notification.title}
                {!notification.read && <span className="ml-2 w-2 h-2 rounded-full bg-primary inline-block"></span>}
              </span>
              <span className="text-xs text-muted-foreground">{formatNotificationTime(notification.created_at)}</span>
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
