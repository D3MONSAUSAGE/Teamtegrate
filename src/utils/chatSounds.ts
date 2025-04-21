
import { SoundSettings } from "@/hooks/useSoundSettings";
import { toast } from "sonner";

// Define multiple audio formats to increase browser compatibility
const CHAT_MESSAGE_SOUND = "/sounds/message.wav";
const CHAT_MESSAGE_SOUND_MP3 = "/sounds/message.mp3"; // Fallback format

// Additional app sound files with both formats
const SUCCESS_SOUND = "/sounds/success.mp3";
const ERROR_SOUND = "/sounds/error.mp3";
const STATUS_CHANGE_SOUND = "/sounds/status-change.mp3";

// Track errors to prevent showing too many toasts
let soundErrorShown = false;

/**
 * Play notification sound for new chat messages
 */
export function playChatNotification(settings: SoundSettings) {
  if (!settings.enabled) return;
  
  // Reset error flag when attempting to play a new sound
  soundErrorShown = false;
  
  // Try to play sound with advanced fallback mechanism
  playSound(CHAT_MESSAGE_SOUND, settings.volume)
    .catch(() => {
      console.log("WAV format failed, trying MP3 fallback");
      // If WAV fails, try MP3
      return playSound(CHAT_MESSAGE_SOUND_MP3, settings.volume);
    })
    .catch(error => {
      if (!soundErrorShown) {
        console.error("Failed to play chat notification sound:", error);
        toast.error("Sound notification failed. Check sound settings.");
        soundErrorShown = true;
      }
    });
}

/**
 * Play a sound file with proper error handling
 */
export function playSound(soundPath: string, volume: number = 0.5): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      
      // Set up event listeners for success/failure
      audio.onended = () => resolve();
      audio.onerror = (error) => {
        console.error(`Error playing sound (${soundPath}):`, error);
        reject(error);
      };
      
      // Add a timeout to handle browser limitations
      const timeoutId = setTimeout(() => {
        reject(new Error("Sound playback timeout"));
      }, 5000);
      
      // Start playback
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Sound started playing successfully
            clearTimeout(timeoutId);
            console.log(`Playing sound: ${soundPath}`);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Sound player for other general app sounds with improved error handling
 */
export function playAppSound(soundType: 'success' | 'error' | 'status-change', volume: number = 0.5) {
  let soundPath: string;
  
  // Select appropriate sound file based on type
  switch (soundType) {
    case 'success':
      soundPath = SUCCESS_SOUND;
      break;
    case 'error':
      soundPath = ERROR_SOUND;
      break;
    case 'status-change':
      soundPath = STATUS_CHANGE_SOUND;
      break;
  }
  
  // Try to play the sound with silent error handling (we don't want to disrupt UX)
  playSound(soundPath, volume).catch(error => {
    // Log error but don't show toast to avoid disrupting UX for non-critical sounds
    console.error(`Failed to play ${soundType} sound:`, error);
  });
}
