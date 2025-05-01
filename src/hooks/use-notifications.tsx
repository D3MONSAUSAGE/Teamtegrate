
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
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    // Limit to fewer notifications on mobile to improve performance
    const limit = isMobile ? 10 : 20;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }
    
    if (data) {
      console.log("Fetched notifications:", data);
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  }, [user, isMobile]);

  useEffect(() => {
    fetchNotifications();

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
  }, [user, fetchNotifications]);

  // Mark notification(s) as read
  const markAsRead = async (id?: string) => {
    if (!user) return;
    
    try {
      if (id) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id)
          .eq("user_id", user.id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
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

  return { notifications, unreadCount, markAsRead, fetchNotifications };
}
