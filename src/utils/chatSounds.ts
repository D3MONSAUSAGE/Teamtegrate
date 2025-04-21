
import { SoundSettings } from "@/hooks/useSoundSettings";
import { toast } from "sonner";

// Using .wav format which is more widely supported by browsers
const CHAT_MESSAGE_SOUND = "/sounds/message.wav";

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
        
        // Show a user-friendly error message
        toast.error("Sound failed to play. Check if sound files are available.");
        
        // Log more detailed information for debugging
        console.error(`Failed to play sound file: ${CHAT_MESSAGE_SOUND}`);
        console.error(`Sound settings used: enabled=${settings.enabled}, volume=${settings.volume}`);
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
        toast.error(`Failed to play sound: ${soundPath.split('/').pop()}`);
      });
    }
  } catch (error) {
    console.error(`Error initializing sound (${soundPath}):`, error);
  }
}
