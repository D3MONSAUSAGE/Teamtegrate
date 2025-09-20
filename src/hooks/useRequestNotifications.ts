import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  request_id: string;
  notification_type: 'created' | 'assigned' | 'status_changed' | 'completed';
  old_status?: string;
  new_status?: string;
  assigned_to?: string;
  message?: string;
}

export const useRequestNotifications = () => {
  const sendNotification = useCallback(async (data: NotificationData) => {
    try {
      console.log('Sending notification:', data);
      
      const { data: result, error } = await supabase.functions.invoke('send-request-notification', {
        body: data
      });

      if (error) {
        console.error('Failed to send notification:', error);
        throw error;
      }

      console.log('Notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending request notification:', error);
      throw error;
    }
  }, []);

  // Convenience methods for specific notification types
  const notifyRequestCreated = useCallback((requestId: string) => {
    return sendNotification({
      request_id: requestId,
      notification_type: 'created'
    });
  }, [sendNotification]);

  const notifyRequestAssigned = useCallback((requestId: string, assignedTo: string) => {
    return sendNotification({
      request_id: requestId,
      notification_type: 'assigned',
      assigned_to: assignedTo
    });
  }, [sendNotification]);

  const notifyStatusChanged = useCallback((requestId: string, oldStatus: string, newStatus: string) => {
    return sendNotification({
      request_id: requestId,
      notification_type: 'status_changed',
      old_status: oldStatus,
      new_status: newStatus
    });
  }, [sendNotification]);

  const notifyRequestCompleted = useCallback((requestId: string) => {
    return sendNotification({
      request_id: requestId,
      notification_type: 'completed'
    });
  }, [sendNotification]);

  return {
    sendNotification,
    notifyRequestCreated,
    notifyRequestAssigned,
    notifyStatusChanged,
    notifyRequestCompleted
  };
};