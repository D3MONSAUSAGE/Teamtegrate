
import { useState, useEffect } from 'react';

interface ConnectionStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  retryCount: number;
}

export const useConnectionStatus = (): ConnectionStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsConnecting(false);
      setLastConnected(new Date());
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnecting(false);
    };

    // Monitor online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection quality through periodic checks
    let intervalId: NodeJS.Timeout;
    
    if (isOnline) {
      intervalId = setInterval(async () => {
        try {
          setIsConnecting(true);
          
          // Simple connection test
          const response = await fetch('/favicon.ico', { 
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            setIsOnline(true);
            setLastConnected(new Date());
            setRetryCount(0);
          } else {
            throw new Error('Connection test failed');
          }
        } catch (error) {
          console.warn('Connection quality check failed:', error);
          setRetryCount(prev => prev + 1);
          
          if (retryCount >= 3) {
            setIsOnline(false);
          }
        } finally {
          setIsConnecting(false);
        }
      }, 30000); // Check every 30 seconds
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline, retryCount]);

  return {
    isOnline,
    isConnecting,
    lastConnected,
    retryCount
  };
};
