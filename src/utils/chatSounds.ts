
import { SoundSettings } from "@/hooks/useSoundSettings";
import { toast } from "sonner";

// You can customize this sound
const CHAT_MESSAGE_SOUND = "/sounds/notification.mp3";

export function playChatNotification(settings: SoundSettings) {
  if (!settings.enabled) return;
  
  try {
    const audio = new Audio(CHAT_MESSAGE_SOUND);
    audio.volume = settings.volume;
    
    // Use promise-based approach for better error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Error playing chat notification sound:", error);
        
        // Only show error toast in development
        if (import.meta.env.DEV) {
          toast.error("Sound failed to play. Check console for details.");
        }
      });
    }
  } catch (error) {
    console.error("Error initializing chat notification sound:", error);
  }
}

// Sound player for other general app sounds
export function playAppSound(soundPath: string, volume: number = 0.5) {
  try {
    const audio = new Audio(soundPath);
    audio.volume = volume;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error(`Error playing sound (${soundPath}):`, error);
      });
    }
  } catch (error) {
    console.error(`Error initializing sound (${soundPath}):`, error);
  }
}
