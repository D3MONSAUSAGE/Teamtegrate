
import { playSound, playAppSound, playWithWebAudioAPI } from "./chatSounds";

// Re-export the general sound functions
export { playSound };

// Convenience functions for specific sounds
export function playSuccessSound(volume: number = 0.5) {
  return playAppSound('success', volume);
}

export function playErrorSound(volume: number = 0.5) {
  return playAppSound('error', volume);
}

export function playStatusChangeSound(volume: number = 0.5) {
  return playAppSound('status-change', volume);
}

// Enhanced test function with better browser compatibility
export function testSoundPlayback(volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("Starting sound test with volume:", volume);
    
    // Try multiple sound files with different formats for better compatibility
    const testSounds = [
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
      
      // Try Web Audio API first
      playWithWebAudioAPI(soundPath, volume)
        .then(() => {
          console.log("Web Audio API test successful");
          resolve(true);
        })
        .catch(() => {
          console.log("Web Audio API failed, trying Audio element");
          // Fallback to Audio element
          const audio = new Audio(soundPath);
          audio.volume = volume;
          
          const onSuccess = () => {
            console.log("Audio element test successful");
            audio.removeEventListener('ended', onSuccess);
            audio.removeEventListener('error', onError);
            resolve(true);
          };
          
          const onError = () => {
            console.log(`Audio element failed for ${soundPath}`);
            audio.removeEventListener('ended', onSuccess);
            audio.removeEventListener('error', onError);
            soundIndex++;
            tryNextSound();
          };
          
          audio.addEventListener('ended', onSuccess);
          audio.addEventListener('error', onError);
          
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch(() => {
              console.log(`Play promise failed for ${soundPath}`);
              onError();
            });
          }
        });
    };
    
    tryNextSound();
  });
}
