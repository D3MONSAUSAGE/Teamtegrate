
import { SoundSettings } from "@/hooks/useSoundSettings";

// You can customize this sound
const CHAT_MESSAGE_SOUND = "/sounds/notification.mp3";

export function playChatNotification(settings: SoundSettings) {
  if (!settings.enabled) return;
  try {
    const audio = new Audio(CHAT_MESSAGE_SOUND);
    audio.volume = settings.volume ?? 0.5;
    audio.play();
  } catch (error) {
    console.error("Error playing chat notification sound:", error);
  }
}
