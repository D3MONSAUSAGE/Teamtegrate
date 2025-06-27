
import { useCallback } from 'react';
import { playChatNotification, markUserInteraction } from '@/utils/chatSounds';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { toast } from 'sonner';

export function useChatSounds() {
  const soundSettings = useSoundSettings();

  const playMessageSound = useCallback(async () => {
    try {
      await playChatNotification(soundSettings);
    } catch (error) {
      console.log('Sound playback failed (this is normal and expected):', error);
      // Don't show error to user - audio failures are common and not critical
    }
  }, [soundSettings]);

  const playBuzzSound = useCallback(async () => {
    // Enhanced buzz/poke sound with visual notification
    try {
      await playChatNotification({ ...soundSettings, volume: Math.min(soundSettings.volume * 1.5, 1) });
      
      // Show buzz notification
      toast.info("💫 Someone buzzed you!", {
        duration: 3000,
        className: "animate-bounce"
      });
      
      // Visual buzz effect could be added here
      document.body.style.animation = "buzz 0.5s ease-in-out";
      setTimeout(() => {
        document.body.style.animation = "";
      }, 500);
      
    } catch (error) {
      console.log('Buzz sound failed (this is normal):', error);
      // Still show the visual notification even if sound fails
      toast.info("💫 Someone buzzed you!", {
        duration: 3000,
        className: "animate-bounce"
      });
    }
  }, [soundSettings]);

  const enableSounds = useCallback(() => {
    markUserInteraction();
  }, []);

  return {
    playMessageSound,
    playBuzzSound,
    enableSounds,
    soundSettings
  };
}
