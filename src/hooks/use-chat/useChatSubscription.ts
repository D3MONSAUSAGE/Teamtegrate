
import { useCallback } from "react";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useChatSubscribe } from "./useChatSubscribe";

export function useChatSubscription(
  roomId: string,
  userId: string | undefined,
  fetchMessages: () => void
) {
  const soundSettings = useSoundSettings();

  const subscribeToMessages = useChatSubscribe(
    fetchMessages,
    roomId,
    userId,
    soundSettings
  );

  return useCallback(() => {
    return subscribeToMessages();
  }, [subscribeToMessages]);
}
