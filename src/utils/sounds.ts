
import { playSound, playAppSound } from "./chatSounds";

// Re-export the general sound functions
export { playSound };

// Convenience functions for specific sounds
export function playSuccessSound(volume: number = 0.5) {
  playAppSound('success', volume);
}

export function playErrorSound(volume: number = 0.5) {
  playAppSound('error', volume);
}

export function playStatusChangeSound(volume: number = 0.5) {
  playAppSound('status-change', volume);
}

// Add a function to test audio playback
export function testSoundPlayback(volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio("/sounds/message.wav");
    audio.volume = volume;
    
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => resolve(false));
    }
  });
}
