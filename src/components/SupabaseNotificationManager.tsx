import React, { useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationChannels } from '@/hooks/useNotificationChannels';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useAuth } from '@/contexts/AuthContext';

const SupabaseNotificationManager: React.FC = () => {
  const { user } = useAuth();
  
  // Initialize notification system - keep these hooks for functionality
  useNotificationChannels();
  useBackgroundSync();

  // Return null to hide the UI component completely
  // but keep the hooks initialized for the notification system to work
  return null;
};

export default SupabaseNotificationManager;
