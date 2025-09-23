import { playSound, playAppSound, playWithWebAudioAPI } from "./chatSounds";

// Web-only sound utilities (no Capacitor dependency)
export { playSound };

// Web-optimized sound paths
const WEB_SOUNDS = {
  success: '/sounds/push-notification.mp3',
  error: '/sounds/error.mp3',
  'status-change': '/sounds/task-notification.mp3',
  chat: '/sounds/chat-notification.mp3',
  notification: '/sounds/push-notification.mp3',
};

// Convenience functions for specific sounds (web-only)
export function playSuccessSound(volume: number = 0.5) {
  return playAppSound('success', volume);
}

export function playErrorSound(volume: number = 0.5) {
  return playAppSound('error', volume);
}

export function playStatusChangeSound(volume: number = 0.5) {
  return playAppSound('status-change', volume);
}

export function playChatSound(volume: number = 0.5) {
  return playAppSound('success', volume);
}

export function playNotificationSound(volume: number = 0.5) {
  return playAppSound('success', volume);
}

// Web sound player
function playWebSound(soundType: keyof typeof WEB_SOUNDS, volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    const soundPath = WEB_SOUNDS[soundType];
    
    if (!soundPath) {
      console.log(`Sound type ${String(soundType)} not found`);
      resolve(false);
      return;
    }
    
    console.log(`Playing web sound: ${String(soundType)} (${soundPath})`);
    
    // Use Audio element for web
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.preload = 'auto';
    
    const onSuccess = () => {
      console.log(`Web sound success: ${String(soundType)}`);
      cleanup();
      resolve(true);
    };
    
    const onError = (error: any) => {
      console.log(`Web sound failed for ${String(soundType)}:`, error);
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
            console.log(`Web audio started playing: ${String(soundType)}`);
          })
          .catch(onError);
      }
    };
    
    audio.addEventListener('ended', onSuccess);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlay);
    
    // Shorter timeout for web
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
  });
}

// Enhanced test function for web
export function testSoundPlayback(volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("Starting web sound test with volume:", volume);
    
    // Test web notification sound
    playWebSound('notification', volume)
      .then((success) => {
        if (success) {
          console.log("Web sound test result:", success);
          resolve(success);
          return;
        }
        
        // Fallback to generic web sound testing
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
      });
  });
}

// Utility to check if sound is available (web-only)
export function isSoundAvailable(): boolean {
  // Check if Web Audio API or HTML5 Audio is available
  return !!(window.AudioContext || (window as any).webkitAudioContext || window.Audio);
}

// Get appropriate sound file for web platform
export function getSoundPath(soundType: string): string {
  if (soundType in WEB_SOUNDS) {
    return WEB_SOUNDS[soundType as keyof typeof WEB_SOUNDS];
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