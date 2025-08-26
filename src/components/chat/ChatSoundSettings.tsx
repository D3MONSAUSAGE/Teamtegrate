
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, VolumeOff } from 'lucide-react';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { useChatSounds } from '@/hooks/useChatSounds';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ChatSoundSettings: React.FC = () => {
  const { enabled, volume, setEnabled, setVolume } = useSoundSettings();
  const { playMessageSound, enableSounds } = useChatSounds();

  const toggleSound = () => {
    setEnabled(!enabled);
    if (!enabled) {
      enableSounds(); // Enable audio context on user interaction
    }
  };

  const handleVolumeChange = ([newVolume]: number[]) => {
    setVolume(newVolume);
  };

  const testSound = async () => {
    enableSounds();
    await playMessageSound();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Sound Settings">
          {enabled ? (
            volume > 0.5 ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeOff className="h-5 w-5" />
            )
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Sound Settings</h4>
            <p className="text-sm text-muted-foreground">
              Configure notification sounds and volume
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="flex-shrink-0"
            >
              {enabled ? 'Disable' : 'Enable'} Sounds
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testSound}
              disabled={!enabled}
              className="flex-shrink-0"
            >
              Test Sound
            </Button>
          </div>
          
          {enabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Volume: {Math.round(volume * 100)}%</label>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChatSoundSettings;
