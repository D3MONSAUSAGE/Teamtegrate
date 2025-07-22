
import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const useNotificationChannels = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initializeChannels = async () => {
      try {
        // Create notification channels for Android
        await LocalNotifications.createChannel({
          id: 'default',
          name: 'Default Notifications',
          description: 'General app notifications',
          importance: 5,
          sound: 'push-notification.mp3',
          vibration: true,
          lights: true,
          lightColor: '#FF0000',
        });

        await LocalNotifications.createChannel({
          id: 'chat',
          name: 'Chat Messages',
          description: 'New chat messages',
          importance: 4,
          sound: 'chat-notification.mp3',
          vibration: true,
        });

        await LocalNotifications.createChannel({
          id: 'tasks',
          name: 'Task Updates',
          description: 'Task assignments and updates',
          importance: 4,
          sound: 'task-notification.mp3',
          vibration: true,
        });

        console.log('Notification channels created successfully');
      } catch (error) {
        console.error('Error creating notification channels:', error);
      }
    };

    initializeChannels();
  }, []);
};
