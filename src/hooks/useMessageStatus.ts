import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

interface MessageStatusMap {
  [messageId: string]: 'sending' | 'sent' | 'delivered' | 'failed';
}

export function useMessageStatus() {
  const [messageStatuses, setMessageStatuses] = useState<MessageStatusMap>({});

  const setMessageStatus = (messageId: string, status: 'sending' | 'sent' | 'delivered' | 'failed') => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: status
    }));
  };

  const clearMessageStatus = (messageId: string) => {
    setMessageStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[messageId];
      return newStatuses;
    });
  };

  // Auto-clear successful statuses after 3 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    Object.entries(messageStatuses).forEach(([messageId, status]) => {
      if (status === 'sent' || status === 'delivered') {
        const timer = setTimeout(() => {
          clearMessageStatus(messageId);
        }, 3000);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [messageStatuses]);

  const getMessageStatus = (messageId: string) => {
    return messageStatuses[messageId];
  };

  const updateMessageWithStatus = (message: ChatMessage): ChatMessage => {
    const status = getMessageStatus(message.id);
    return {
      ...message,
      status
    };
  };

  return {
    messageStatuses,
    setMessageStatus,
    clearMessageStatus,
    getMessageStatus,
    updateMessageWithStatus
  };
}