import React from 'react';
import { Loader2, MessageCircle, Clock } from 'lucide-react';

interface MessageLoadingIndicatorProps {
  type: 'initial' | 'more' | 'sending';
  messageCount?: number;
}

export const MessageLoadingIndicator: React.FC<MessageLoadingIndicatorProps> = ({
  type,
  messageCount = 0
}) => {
  const getContent = () => {
    switch (type) {
      case 'initial':
        return {
          icon: <MessageCircle className="h-6 w-6 animate-pulse" />,
          title: 'Loading messages...',
          description: 'Getting your conversation history'
        };
      case 'more':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Loading older messages...',
          description: messageCount > 0 ? `${messageCount} messages loaded` : ''
        };
      case 'sending':
        return {
          icon: <Clock className="h-4 w-4 animate-pulse" />,
          title: 'Sending...',
          description: 'Your message is being sent'
        };
      default:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Loading...',
          description: ''
        };
    }
  };

  const { icon, title, description } = getContent();

  if (type === 'more') {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
    );
  }

  if (type === 'sending') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
        {icon}
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
};