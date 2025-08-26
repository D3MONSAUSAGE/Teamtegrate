import { useState, useEffect, useCallback } from 'react';
import { useConnectionStatus } from './useConnectionStatus';
import { supabase } from '@/integrations/supabase/client';

interface ChatConnectionStatus {
  isOnline: boolean;
  isConnecting: boolean;
  realtimeConnected: boolean;
  messageQueueSize: number;
  lastMessageSent: Date | null;
  lastMessageReceived: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  retryCount: number;
}

interface UseChatConnectionStatusOptions {
  roomId?: string;
  enableRealtime?: boolean;
}

export const useChatConnectionStatus = (options: UseChatConnectionStatusOptions = {}) => {
  const { roomId, enableRealtime = true } = options;
  const baseStatus = useConnectionStatus();
  
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [messageQueueSize, setMessageQueueSize] = useState(0);
  const [lastMessageSent, setLastMessageSent] = useState<Date | null>(null);
  const [lastMessageReceived, setLastMessageReceived] = useState<Date | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');

  // Monitor Supabase realtime connection
  useEffect(() => {
    if (!enableRealtime || !baseStatus.isOnline) {
      setRealtimeConnected(false);
      return;
    }

    let channel: any;
    let statusTimeout: NodeJS.Timeout;

    const setupRealtimeMonitoring = () => {
      // Create a test channel to monitor realtime connectivity
      channel = supabase
        .channel('connection_test')
        .on('presence', { event: 'sync' }, () => {
          setRealtimeConnected(true);
          clearTimeout(statusTimeout);
          
          // If no presence events after 10 seconds, consider disconnected
          statusTimeout = setTimeout(() => {
            setRealtimeConnected(false);
          }, 10000);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeConnected(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setRealtimeConnected(false);
          }
        });
    };

    setupRealtimeMonitoring();

    return () => {
      clearTimeout(statusTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enableRealtime, baseStatus.isOnline]);

  // Update connection quality based on various factors
  useEffect(() => {
    if (!baseStatus.isOnline) {
      setConnectionQuality('offline');
      return;
    }

    if (baseStatus.isConnecting || !realtimeConnected) {
      setConnectionQuality('poor');
      return;
    }

    // Determine quality based on recent activity and retry count
    const now = new Date();
    const recentMessageActivity = (
      lastMessageSent && (now.getTime() - lastMessageSent.getTime()) < 30000
    ) || (
      lastMessageReceived && (now.getTime() - lastMessageReceived.getTime()) < 30000
    );

    if (baseStatus.retryCount === 0 && recentMessageActivity) {
      setConnectionQuality('excellent');
    } else if (baseStatus.retryCount <= 1) {
      setConnectionQuality('good');
    } else {
      setConnectionQuality('poor');
    }
  }, [baseStatus.isOnline, baseStatus.isConnecting, baseStatus.retryCount, realtimeConnected, lastMessageSent, lastMessageReceived]);

  // Message tracking methods
  const recordMessageSent = useCallback(() => {
    setLastMessageSent(new Date());
  }, []);

  const recordMessageReceived = useCallback(() => {
    setLastMessageReceived(new Date());
  }, []);

  const updateMessageQueue = useCallback((size: number) => {
    setMessageQueueSize(size);
  }, []);

  const getStatusText = () => {
    if (!baseStatus.isOnline) return 'Offline';
    if (baseStatus.isConnecting) return 'Reconnecting...';
    if (!realtimeConnected) return 'Connecting to chat...';
    if (messageQueueSize > 0) return `${messageQueueSize} messages pending`;
    
    switch (connectionQuality) {
      case 'excellent': return 'Connected';
      case 'good': return 'Connected';
      case 'poor': return 'Poor connection';
      default: return 'Offline';
    }
  };

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (!baseStatus.isOnline) return 'destructive';
    if (connectionQuality === 'poor' || messageQueueSize > 0) return 'secondary';
    return 'default';
  };

  const shouldShowIndicator = () => {
    return !baseStatus.isOnline || 
           baseStatus.isConnecting || 
           !realtimeConnected || 
           messageQueueSize > 0 || 
           connectionQuality === 'poor';
  };

  return {
    // Base connection status
    ...baseStatus,
    
    // Chat-specific status
    realtimeConnected,
    messageQueueSize,
    lastMessageSent,
    lastMessageReceived,
    connectionQuality,
    
    // Helper methods
    recordMessageSent,
    recordMessageReceived,
    updateMessageQueue,
    getStatusText,
    getStatusVariant,
    shouldShowIndicator,
    
    // Computed status
    isFullyConnected: baseStatus.isOnline && realtimeConnected,
    canSendMessages: baseStatus.isOnline && !baseStatus.isConnecting
  };
};