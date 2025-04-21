
import { playSound, playAppSound, playWithWebAudioAPI } from "./chatSounds";

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

// Add a function to test audio playback with multiple fallbacks
export function testSoundPlayback(volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    // Try Web Audio API first (best compatibility)
    import('./chatSounds').then(({ playWithWebAudioAPI }) => {
      playWithWebAudioAPI("/sounds/message.wav", volume)
        .then(() => resolve(true))
        .catch(() => {
          // If Web Audio API fails, try WAV with Audio element
          console.log("Testing with Audio element: WAV");
          const audio = new Audio("/sounds/message.wav");
          audio.volume = volume;
          
          audio.onended = () => resolve(true);
          audio.onerror = () => {
            // If WAV fails, try MP3
            console.log("Testing with Audio element: MP3");
            const mp3Audio = new Audio("/sounds/message.mp3");
            mp3Audio.volume = volume;
            
            mp3Audio.onended = () => resolve(true);
            mp3Audio.onerror = () => resolve(false);
            
            const mp3Promise = mp3Audio.play();
            if (mp3Promise) mp3Promise.catch(() => resolve(false));
          };
          
          const wavPromise = audio.play();
          if (wavPromise) wavPromise.catch(() => {
            // Try MP3 if WAV fails to play
            const mp3Audio = new Audio("/sounds/message.mp3");
            mp3Audio.volume = volume;
            
            mp3Audio.onended = () => resolve(true);
            mp3Audio.onerror = () => resolve(false);
            
            const mp3Promise = mp3Audio.play();
            if (mp3Promise) mp3Promise.catch(() => resolve(false));
          });
        });
    }).catch(() => {
      // If module import fails, try direct Audio element approach
      const audio = new Audio("/sounds/message.mp3");
      audio.volume = volume;
      
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      
      const playPromise = audio.play();
      if (playPromise) playPromise.catch(() => resolve(false));
    });
  });
}
