
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playChatNotification } from "@/utils/chatSounds";
import { SoundSettings } from "@/hooks/useSoundSettings";

export function useChatSubscribe(fetchMessages: () => void, roomId: string, userId: string | undefined, soundSettings: SoundSettings) {
  return useCallback(() => {
    console.log('Subscribing to chat messages with sound settings:', { enabled: soundSettings.enabled, volume: soundSettings.volume });

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          fetchMessages();
          if (payload.eventType === "INSERT" && payload.new?.user_id !== userId) {
            console.log('New message received, playing notification sound');
            playChatNotification(soundSettings);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from chat messages');
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, soundSettings.enabled, soundSettings.volume, fetchMessages, soundSettings]);
}
