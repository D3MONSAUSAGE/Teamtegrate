
import { playSound, playAppSound, playWithWebAudioAPI } from "./chatSounds";
import { Capacitor } from '@capacitor/core';

// Re-export the general sound functions
export { playSound };

// Mobile-optimized sound paths
const MOBILE_SOUNDS = {
  success: '/sounds/push-notification.mp3',
  error: '/sounds/error.mp3',
  'status-change': '/sounds/task-notification.mp3',
  chat: '/sounds/chat-notification.mp3',
  notification: '/sounds/push-notification.mp3',
};

// Convenience functions for specific sounds with mobile optimization
export function playSuccessSound(volume: number = 0.5) {
  if (Capacitor.isNativePlatform()) {
    return playMobileSound('success', volume);
  }
  return playAppSound('success', volume);
}

export function playErrorSound(volume: number = 0.5) {
  if (Capacitor.isNativePlatform()) {
    return playMobileSound('error', volume);
  }
  return playAppSound('error', volume);
}

export function playStatusChangeSound(volume: number = 0.5) {
  if (Capacitor.isNativePlatform()) {
    return playMobileSound('status-change', volume);
  }
  return playAppSound('status-change', volume);
}

export function playChatSound(volume: number = 0.5) {
  if (Capacitor.isNativePlatform()) {
    return playMobileSound('chat', volume);
  }
  return playAppSound('success', volume);
}

export function playNotificationSound(volume: number = 0.5) {
  if (Capacitor.isNativePlatform()) {
    return playMobileSound('notification', volume);
  }
  return playAppSound('success', volume);
}

// Mobile-optimized sound player
function playMobileSound(soundType: keyof typeof MOBILE_SOUNDS, volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    const soundPath = MOBILE_SOUNDS[soundType];
    
    if (!soundPath) {
      console.log(`Sound type ${soundType} not found`);
      resolve(false);
      return;
    }
    
    console.log(`Playing mobile sound: ${soundType} (${soundPath})`);
    
    // On mobile, prefer Audio element for better compatibility
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.preload = 'auto';
    
    const onSuccess = () => {
      console.log(`Mobile sound success: ${soundType}`);
      cleanup();
      resolve(true);
    };
    
    const onError = (error: any) => {
      console.log(`Mobile sound failed for ${soundType}:`, error);
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      audio.removeEventListener('ended', onSuccess);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onCanPlay);
    };
    
    const onCanPlay = () => {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            console.log(`Mobile audio started playing: ${soundType}`);
          })
          .catch(onError);
      }
    };
    
    audio.addEventListener('ended', onSuccess);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlay);
    
    // Shorter timeout for mobile
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
  });
}

// Enhanced test function for mobile
export function testSoundPlayback(volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("Starting mobile sound test with volume:", volume);
    
    if (Capacitor.isNativePlatform()) {
      // Test mobile notification sound
      playMobileSound('notification', volume)
        .then((success) => {
          console.log("Mobile sound test result:", success);
          resolve(success);
        });
    } else {
      // Fall back to web sound testing
      const testSounds = [
        "/sounds/push-notification.mp3",
        "/sounds/success.mp3", 
        "/sounds/message.mp3", 
        "/sounds/message.wav"
      ];
      
      let soundIndex = 0;
      
      const tryNextSound = () => {
        if (soundIndex >= testSounds.length) {
          console.log("All sound tests failed");
          resolve(false);
          return;
        }
        
        const soundPath = testSounds[soundIndex];
        console.log(`Testing sound ${soundIndex + 1}/${testSounds.length}: ${soundPath}`);
        
        playWithWebAudioAPI(soundPath, volume)
          .then(() => {
            console.log("Web Audio API test successful");
            resolve(true);
          })
          .catch(() => {
            console.log("Web Audio API failed, trying Audio element");
            playSound(soundPath, volume)
              .then(() => {
                console.log("Audio element test successful");
                resolve(true);
              })
              .catch(() => {
                console.log(`Audio element failed for ${soundPath}`);
                soundIndex++;
                tryNextSound();
              });
          });
      };
      
      tryNextSound();
    }
  });
}

// Utility to check if sound is available
export function isSoundAvailable(): boolean {
  if (Capacitor.isNativePlatform()) {
    return true; // Native platforms support sound
  }
  
  // Check if Web Audio API or HTML5 Audio is available
  return !!(window.AudioContext || (window as any).webkitAudioContext || window.Audio);
}

// Get appropriate sound file for platform
export function getSoundPath(soundType: string): string {
  if (Capacitor.isNativePlatform() && soundType in MOBILE_SOUNDS) {
    return MOBILE_SOUNDS[soundType as keyof typeof MOBILE_SOUNDS];
  }
  
  // Fallback to default sounds
  switch (soundType) {
    case 'success':
      return '/sounds/success.mp3';
    case 'error':
      return '/sounds/error.mp3';
    case 'status-change':
      return '/sounds/status-change.mp3';
    default:
      return '/sounds/notification.mp3';
  }
}
