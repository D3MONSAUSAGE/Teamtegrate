
import { useState, useEffect } from 'react';

interface ConnectionStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  retryCount: number;
}

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastConnected: navigator.onLine ? new Date() : null,
    retryCount: 0
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastConnected: new Date(),
        retryCount: 0
      }));
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setConnecting = (connecting: boolean) => {
    setStatus(prev => ({
      ...prev,
      isConnecting: connecting,
      retryCount: connecting ? prev.retryCount + 1 : prev.retryCount
    }));
  };

  return {
    ...status,
    setConnecting
  };
};
