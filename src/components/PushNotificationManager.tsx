
import React, { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PushNotificationManager: React.FC = () => {
  const { pushToken, isRegistered } = usePushNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (isRegistered && pushToken && user) {
      console.log('Push notifications registered successfully');
      toast.success('Push notifications enabled');
    }
  }, [isRegistered, pushToken, user]);

  // This component doesn't render anything visible
  return null;
};

export default PushNotificationManager;
