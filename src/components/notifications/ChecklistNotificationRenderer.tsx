import React from 'react';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChecklistNotificationProps {
  notification: {
    id: string;
    type: string;
    title: string;
    content: string;
    created_at: string;
    is_read: boolean;
    metadata?: {
      checklistId?: string;
      checklistTitle?: string;
      teamName?: string;
      runId?: string;
      windowLabel?: string;
      percentComplete?: number;
    };
  };
  onRead: (id: string) => void;
}

export function ChecklistNotificationRenderer({ notification, onRead }: ChecklistNotificationProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    
    // Navigate to checklist run if available
    if (notification.metadata?.runId) {
      window.location.href = `/checklists/runs/${notification.metadata.runId}`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'checklist_upcoming':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'checklist_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDisplayTitle = () => {
    const { metadata } = notification;
    if (!metadata) return notification.title;

    switch (notification.type) {
      case 'checklist_upcoming':
        return `Upcoming checklist "${metadata.checklistTitle}" — ${metadata.teamName} — ${metadata.windowLabel}`;
      case 'checklist_completed':
        return `Completed checklist "${metadata.checklistTitle}" — ${metadata.teamName} — ${metadata.percentComplete || 0}%`;
      default:
        return notification.title;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50
        ${!notification.is_read ? 'bg-primary/5 border border-primary/20' : ''}
      `}
    >
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground leading-tight">
          {getDisplayTitle()}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {notification.content}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </div>
      </div>
      
      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
      )}
    </div>
  );
}