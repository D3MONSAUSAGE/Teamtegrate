
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playSuccessSound } from "@/utils/sounds";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  read: boolean;
  created_at: string;
  priority?: 'high' | 'medium' | 'low';
  category?: 'work' | 'personal' | 'system';
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();

  const fetchNotifications = useCallback(async (options?: {
    limit?: number;
    dateRange?: { from: Date; to: Date };
  }) => {
    if (!user) return;
    
    // Use provided limit or default based on device
    const limit = options?.limit || (isMobile ? 50 : 100);
    
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);

    // Apply date range filter if provided
    if (options?.dateRange) {
      query = query
        .gte("created_at", options.dateRange.from.toISOString())
        .lte("created_at", options.dateRange.to.toISOString());
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }
    
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  }, [user, isMobile]);

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user?.id]); // Only depend on user.id to prevent loops

  // Separate effect for real-time subscription
  useEffect(() => {
    if (!user) return;
    
    // Real-time subscription for new notifications
    const channel = supabase
      .channel("public:notifications:user_" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log("Received new notification:", payload);
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Show toast notification on both desktop and mobile
          toast.success(notif.title || "New Notification", {
            description: notif.content || "",
            duration: 5000,
          });
          
          // Play sound notification
          playSuccessSound();
        }
      )
      .subscribe();

    console.log("Subscribed to real-time notifications for user:", user.id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user.id

  // Mark notification(s) as read
  const markAsRead = async (ids?: string | string[]) => {
    if (!user) return;
    
    try {
      if (ids) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        await supabase
          .from("notifications")
          .update({ read: true })
          .in("id", idArray)
          .eq("user_id", user.id);
        
        setNotifications((prev) => 
          prev.map((n) => idArray.includes(n.id) ? { ...n, read: true } : n)
        );
        setUnreadCount((prev) => Math.max(0, prev - idArray.length));
      } else {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user.id);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark notification(s) as unread
  const markAsUnread = async (ids: string | string[]) => {
    if (!user) return;
    
    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      await supabase
        .from("notifications")
        .update({ read: false })
        .in("id", idArray)
        .eq("user_id", user.id);
      
      setNotifications((prev) => 
        prev.map((n) => idArray.includes(n.id) ? { ...n, read: false } : n)
      );
      setUnreadCount((prev) => prev + idArray.length);
    } catch (error) {
      console.error("Error marking notifications as unread:", error);
    }
  };

  // Delete notification(s)
  const deleteNotifications = async (ids: string | string[]) => {
    if (!user) return;
    
    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      await supabase
        .from("notifications")
        .delete()
        .in("id", idArray)
        .eq("user_id", user.id);
      
      setNotifications((prev) => prev.filter((n) => !idArray.includes(n.id)));
      setUnreadCount((prev) => {
        const deletedUnread = notifications.filter(n => idArray.includes(n.id) && !n.read).length;
        return Math.max(0, prev - deletedUnread);
      });
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  };

  // Archive notification(s) - For future use, currently just deletes 
  const archiveNotifications = async (ids: string | string[]) => {
    // For now, archive means delete since we don't have archived field
    await deleteNotifications(ids);
  };

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAsUnread,
    deleteNotifications,
    archiveNotifications,
    fetchNotifications 
  };
}
