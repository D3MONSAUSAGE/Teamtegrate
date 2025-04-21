
import { SoundSettings } from "@/hooks/useSoundSettings";
import { toast } from "sonner";

// Define multiple audio formats to increase browser compatibility
const CHAT_MESSAGE_SOUND = "/sounds/message.wav";
const CHAT_MESSAGE_SOUND_MP3 = "/sounds/message.mp3"; // Fallback format

// Additional app sound files
const SUCCESS_SOUND = "/sounds/success.mp3";
const ERROR_SOUND = "/sounds/error.mp3";
const STATUS_CHANGE_SOUND = "/sounds/status-change.mp3";

// Track errors to prevent showing too many toasts
let soundErrorShown = false;
let audioContext: AudioContext | null = null;

/**
 * Play notification sound for new chat messages with enhanced browser compatibility
 */
export function playChatNotification(settings: SoundSettings) {
  if (!settings.enabled) return;
  
  // Reset error flag when attempting to play a new sound
  soundErrorShown = false;
  
  // First try the Web Audio API approach which has better browser support
  playWithWebAudioAPI(CHAT_MESSAGE_SOUND, settings.volume)
    .catch(() => {
      console.log("Web Audio API failed, trying Audio element with WAV");
      // If Web Audio API fails, try WAV with Audio element
      return playSound(CHAT_MESSAGE_SOUND, settings.volume);
    })
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
 * Play a sound using Web Audio API for better browser compatibility
 */
export async function playWithWebAudioAPI(soundPath: string, volume: number = 0.5): Promise<void> {
  try {
    if (!audioContext) {
      // Create audio context on first use (needs user gesture)
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Fetch the audio file
    const response = await fetch(soundPath);
    if (!response.ok) throw new Error(`Failed to fetch sound file: ${soundPath}`);
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create audio source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play the sound
    source.start(0);
    
    // Return a promise that resolves when the sound finishes playing
    return new Promise((resolve) => {
      source.onended = () => resolve();
      // Fallback if onended doesn't fire
      setTimeout(resolve, audioBuffer.duration * 1000 + 100);
    });
  } catch (error) {
    console.error("Web Audio API playback failed:", error);
    throw error; // Re-throw to try fallback methods
  }
}

/**
 * Play a sound file with the Audio element (fallback method)
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
  
  // Try to play the sound with fallback to Web Audio API for better compatibility
  playWithWebAudioAPI(soundPath, volume).catch((error) => {
    // Fall back to Audio element if Web Audio API fails
    playSound(soundPath, volume).catch(error => {
      // Log error but don't show toast to avoid disrupting UX for non-critical sounds
      console.error(`Failed to play ${soundType} sound:`, error);
    });
  });
}
