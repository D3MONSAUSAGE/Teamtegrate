
import { useState, useEffect } from 'react';
import { networkManager } from '@/utils/networkManager';

export const useNetworkMonitoring = () => {
  const [networkStatus, setNetworkStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const [requestsInFlight, setRequestsInFlight] = useState(0);

  // Monitor network health
  useEffect(() => {
    const checkNetworkHealth = () => {
      const failureRate = networkManager.getFailureRate();
      const avgResponseTime = networkManager.getAverageResponseTime();
      
      if (failureRate > 0.5 || avgResponseTime > 10000) {
        setNetworkStatus('degraded');
      } else if (failureRate > 0.8) {
        setNetworkStatus('offline');
      } else {
        setNetworkStatus('healthy');
      }
    };

    const interval = setInterval(checkNetworkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    networkStatus,
    requestsInFlight,
    setRequestsInFlight
  };
};
