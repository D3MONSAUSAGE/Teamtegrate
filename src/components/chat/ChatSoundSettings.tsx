
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, TestTube } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { playChatNotification } from '@/utils/chatSounds';
import { testSoundPlayback } from '@/utils/sounds';
import { toast } from 'sonner';

const ChatSoundSettings: React.FC = () => {
  const { enabled, volume, setEnabled, setVolume } = useSoundSettings();
  const [testing, setTesting] = useState(false);

  const handleTestSound = async () => {
    if (!enabled) {
      toast.info("Enable sound first to test notifications");
      return;
    }

    setTesting(true);
    try {
      // Test the actual chat notification sound
      await playChatNotification({ enabled: true, volume });
      toast.success("Sound test successful! 🔊");
    } catch (error) {
      console.error('Sound test failed:', error);
      toast.error("Sound test failed. Check your browser audio settings.");
    } finally {
      setTesting(false);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0] / 100);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          title="Sound Settings"
        >
          {enabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle">Chat Notifications</Label>
            <Switch
              id="sound-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          {enabled && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <Button
                onClick={handleTestSound}
                disabled={testing}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? "Testing..." : "Test Sound"}
              </Button>
            </>
          )}
          
          <p className="text-xs text-muted-foreground">
            You'll hear a sound when new messages arrive from other users.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChatSoundSettings;
