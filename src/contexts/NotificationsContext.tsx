import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  priority?: string;
  category?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (ids?: string | string[]) => Promise<void>;
  markAsUnread: (ids: string | string[]) => Promise<void>;
  deleteNotifications: (ids: string | string[]) => Promise<void>;
  archiveNotifications: (ids: string | string[]) => Promise<void>;
  fetchNotifications: (limit?: number, startDate?: Date, endDate?: Date) => Promise<Notification[]>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (
    limit: number = 50,
    startDate?: Date,
    endDate?: Date
  ): Promise<Notification[]> => {
    if (!user?.id) return [];

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      return [];
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications().then((data) => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });
  }, [user?.id, fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          toast(newNotification.title, {
            description: newNotification.content,
          });

          try {
            const audio = new Audio('/notification.mp3');
            await audio.play();
          } catch (error) {
            console.log('Could not play notification sound:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          setUnreadCount(prev => {
            const oldNotification = notifications.find(n => n.id === updatedNotification.id);
            if (oldNotification && !oldNotification.read && updatedNotification.read) {
              return Math.max(0, prev - 1);
            } else if (oldNotification && oldNotification.read && !updatedNotification.read) {
              return prev + 1;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id as string;
          const deletedNotification = notifications.find(n => n.id === deletedId);
          
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
          
          if (deletedNotification && !deletedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, notifications]);

  const markAsRead = useCallback(async (ids?: string | string[]) => {
    if (!user?.id) return;

    try {
      let notificationIds: string[];

      if (!ids) {
        notificationIds = notifications.filter(n => !n.read).map(n => n.id);
      } else {
        notificationIds = Array.isArray(ids) ? ids : [ids];
      }

      if (notificationIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately for instant UI feedback
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [user?.id, notifications]);

  const markAsUnread = useCallback(async (ids: string | string[]) => {
    if (!user?.id) return;

    try {
      const notificationIds = Array.isArray(ids) ? ids : [ids];

      const { error } = await supabase
        .from('notifications')
        .update({ read: false })
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: false } : n)
      );
      
      const previouslyRead = notifications.filter(n => notificationIds.includes(n.id) && n.read).length;
      setUnreadCount(prev => prev + previouslyRead);
    } catch (error) {
      console.error('Error marking notifications as unread:', error);
    }
  }, [user?.id, notifications]);

  const deleteNotifications = useCallback(async (ids: string | string[]) => {
    if (!user?.id) return;

    try {
      const notificationIds = Array.isArray(ids) ? ids : [ids];

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately
      const deletedUnreadCount = notifications.filter(n => notificationIds.includes(n.id) && !n.read).length;
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  }, [user?.id, notifications]);

  const archiveNotifications = useCallback(async (ids: string | string[]) => {
    return deleteNotifications(ids);
  }, [deleteNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    deleteNotifications,
    archiveNotifications,
    fetchNotifications
  }), [notifications, unreadCount, markAsRead, markAsUnread, deleteNotifications, archiveNotifications, fetchNotifications]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
