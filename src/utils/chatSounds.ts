
import { SoundSettings } from "@/hooks/useSoundSettings";

// Define multiple audio formats to increase browser compatibility
const CHAT_MESSAGE_SOUND = "/sounds/notification.mp3";
const CHAT_MESSAGE_SOUND_WAV = "/sounds/message.wav";
const CHAT_MESSAGE_SOUND_FALLBACK = "/sounds/message.mp3";

// Additional app sound files
const SUCCESS_SOUND = "/sounds/success.mp3";
const ERROR_SOUND = "/sounds/error.mp3";
const STATUS_CHANGE_SOUND = "/sounds/status-change.mp3";

// Track audio context and user interaction
let audioContext: AudioContext | null = null;
let userHasInteracted = false;

/**
 * Initialize audio context on user interaction
 */
function initAudioContext(): AudioContext | null {
  if (!audioContext && userHasInteracted) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if it's suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (error) {
      console.log("Web Audio API not supported:", error);
      return null;
    }
  }
  return audioContext;
}

/**
 * Mark that user has interacted with the page (required for audio)
 */
export function markUserInteraction() {
  userHasInteracted = true;
  console.log("User interaction detected - audio is now enabled");
}

/**
 * Play notification sound for new chat messages with enhanced browser compatibility
 */
export function playChatNotification(settings: SoundSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!settings.enabled) {
      resolve();
      return;
    }

    // Mark user interaction if not already done
    if (!userHasInteracted) {
      markUserInteraction();
    }

    console.log('Playing chat notification with settings:', settings);
    
    // Try multiple sound files in order of preference
    const soundFiles = [CHAT_MESSAGE_SOUND, CHAT_MESSAGE_SOUND_WAV, CHAT_MESSAGE_SOUND_FALLBACK];
    
    let currentFileIndex = 0;
    
    const tryNextSound = () => {
      if (currentFileIndex >= soundFiles.length) {
        console.error("All chat notification sounds failed");
        reject(new Error("Failed to play any notification sound"));
        return;
      }
      
      const soundFile = soundFiles[currentFileIndex];
      console.log(`Trying sound file ${currentFileIndex + 1}/${soundFiles.length}: ${soundFile}`);
      
      // Try Web Audio API first
      playWithWebAudioAPI(soundFile, settings.volume)
        .then(() => {
          console.log(`Successfully played notification: ${soundFile}`);
          resolve();
        })
        .catch(() => {
          console.log(`Web Audio API failed for ${soundFile}, trying Audio element`);
          // Fall back to Audio element
          playSound(soundFile, settings.volume)
            .then(() => {
              console.log(`Successfully played notification with Audio element: ${soundFile}`);
              resolve();
            })
            .catch(() => {
              console.log(`Audio element failed for ${soundFile}`);
              currentFileIndex++;
              tryNextSound();
            });
        });
    };
    
    tryNextSound();
  });
}

/**
 * Play a sound using Web Audio API for better browser compatibility
 */
export async function playWithWebAudioAPI(soundPath: string, volume: number = 0.5): Promise<void> {
  const context = initAudioContext();
  if (!context) {
    throw new Error("AudioContext not available or user hasn't interacted");
  }

  console.log(`Loading sound with Web Audio API: ${soundPath}`);
  
  // Fetch the audio file
  const response = await fetch(soundPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch sound file: ${soundPath} (${response.status})`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  
  // Decode the audio data
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  
  // Create audio source
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create gain node for volume control
  const gainNode = context.createGain();
  gainNode.gain.value = Math.max(0, Math.min(1, volume));
  
  // Connect nodes
  source.connect(gainNode);
  gainNode.connect(context.destination);
  
  // Play the sound
  source.start(0);
  
  console.log(`Successfully playing sound: ${soundPath} at volume ${volume}`);
  
  // Return a promise that resolves when the sound finishes playing
  return new Promise((resolve) => {
    source.onended = () => {
      console.log(`Sound finished: ${soundPath}`);
      resolve();
    };
    // Fallback timeout
    setTimeout(() => {
      console.log(`Sound timeout: ${soundPath}`);
      resolve();
    }, audioBuffer.duration * 1000 + 500);
  });
}

/**
 * Play a sound file with the Audio element (fallback method)
 */
export function playSound(soundPath: string, volume: number = 0.5): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Playing sound with Audio element: ${soundPath}`);
      
      const audio = new Audio(soundPath);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.preload = 'auto';
      
      const onSuccess = () => {
        console.log(`Audio element success: ${soundPath}`);
        cleanup();
        resolve();
      };
      
      const onError = (error: any) => {
        console.error(`Audio element error for ${soundPath}:`, error);
        cleanup();
        reject(error);
      };
      
      const cleanup = () => {
        audio.removeEventListener('ended', onSuccess);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('canplaythrough', onCanPlay);
      };
      
      const onCanPlay = () => {
        console.log(`Audio can play: ${soundPath}`);
        const playPromise = audio.play();
        if (playPromise) {
          playPromise
            .then(() => {
              console.log(`Audio started playing: ${soundPath}`);
            })
            .catch(onError);
        }
      };
      
      audio.addEventListener('ended', onSuccess);
      audio.addEventListener('error', onError);
      audio.addEventListener('canplaythrough', onCanPlay);
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        cleanup();
        reject(new Error("Sound playback timeout"));
      }, 10000);
      
    } catch (error) {
      console.error(`Error creating Audio element for ${soundPath}:`, error);
      reject(error);
    }
  });
}

/**
 * Sound player for other general app sounds with improved error handling
 */
export function playAppSound(soundType: 'success' | 'error' | 'status-change', volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    let soundPath: string;
    
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
    
    console.log(`Playing app sound: ${soundType} (${soundPath})`);
    
    // Try Web Audio API first
    playWithWebAudioAPI(soundPath, volume)
      .then(() => {
        console.log(`App sound success with Web Audio API: ${soundType}`);
        resolve(true);
      })
      .catch(() => {
        console.log(`Web Audio API failed for ${soundType}, trying Audio element`);
        // Fall back to Audio element
        playSound(soundPath, volume)
          .then(() => {
            console.log(`App sound success with Audio element: ${soundType}`);
            resolve(true);
          })
          .catch(error => {
            console.error(`Failed to play ${soundType} sound:`, error);
            resolve(false);
          });
      });
  });
}
